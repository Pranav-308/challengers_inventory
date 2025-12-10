const { createRequest, getAllRequests, findRequestById, updateRequest, deleteRequest } = require('../models/ComponentRequest');
const { findComponentById, updateComponent } = require('../models/Component');
const { findUserById } = require('../models/User');
const { createHistory } = require('../models/CheckoutHistory');
const { notifyAdminsAboutRequest } = require('../services/notificationService');

// @desc    Create component request (Member)
// @route   POST /api/requests
// @access  Private
const requestComponent = async (req, res) => {
  try {
    const { componentId, notes, requestedDays } = req.body;

    const component = await findComponentById(componentId);
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Check if component is available
    if (component.status !== 'available') {
      return res.status(400).json({ 
        message: `Component is not available. Current status: ${component.status}` 
      });
    }

    // Check if user already has a pending request for this component
    // Get all user's pending requests and filter in code
    const userPendingRequests = await getAllRequests({ 
      userId: req.user.id, 
      status: 'pending'
    });
    
    const existingForComponent = userPendingRequests.filter(r => r.componentId === componentId);

    if (existingForComponent.length > 0) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this component' 
      });
    }

    const request = await createRequest({
      userId: req.user.id,
      componentId: componentId,
      notes: notes || '',
      requestedDays: requestedDays || component.checkoutDuration,
    });

    // Get member details for notification
    const member = await findUserById(req.user.id);

    // Send notifications to all admins (don't fail if notifications error)
    try {
      await notifyAdminsAboutRequest(member, component, notes || '', requestedDays || component.checkoutDuration);
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Request component error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all requests (Admin sees all, Member sees their own)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    const filter = {};
    
    // Members can only see their own requests
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    }

    // Apply query filters
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await getAllRequests(filter);

    // Populate user and component details
    const populatedRequests = await Promise.all(requests.map(async (request) => {
      const user = await findUserById(request.userId);
      const component = await findComponentById(request.componentId);
      const responder = request.respondedBy ? await findUserById(request.respondedBy) : null;
      
      return {
        ...request,
        user: user ? { id: user.id, name: user.name, username: user.username } : null,
        component: component ? { 
          id: component.id, 
          name: component.name, 
          componentId: component.componentId,
          status: component.status 
        } : null,
        respondedByUser: responder ? { id: responder.id, name: responder.name, username: responder.username } : null,
      };
    }));

    res.json(populatedRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve request and checkout component (Admin only)
// @route   PATCH /api/requests/:id/approve
// @access  Private/Admin
const approveRequest = async (req, res) => {
  try {
    const request = await findRequestById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    const component = await findComponentById(request.componentId);
    
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    if (component.status !== 'available') {
      return res.status(400).json({ 
        message: `Component is no longer available. Current status: ${component.status}` 
      });
    }

    // Checkout the component
    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (request.requestedDays || component.checkoutDuration));

    await updateComponent(request.componentId, {
      status: 'taken',
      currentBorrower: request.userId,
      checkedOutAt: checkoutDate,
      dueDate: dueDate,
    });

    // Create checkout history
    await createHistory({
      componentId: request.componentId,
      userId: request.userId,
      action: 'checkout',
      notes: request.notes,
    });

    // Update request status
    await updateRequest(req.params.id, {
      status: 'approved',
      respondedAt: new Date(),
      respondedBy: req.user.id,
    });

    // Send email notification to member about approval and checkout
    const member = await findUserById(request.userId);
    if (member && member.email) {
      const { notifyCheckout } = require('../services/emailService');
      const updatedComponent = await findComponentById(request.componentId);
      notifyCheckout(member, updatedComponent).catch(err => 
        console.error('Checkout notification error:', err)
      );
    }

    res.json({ message: 'Request approved and component checked out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject request (Admin only)
// @route   PATCH /api/requests/:id/reject
// @access  Private/Admin
const rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await findRequestById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    await updateRequest(req.params.id, {
      status: 'rejected',
      respondedAt: new Date(),
      respondedBy: req.user.id,
      rejectionReason: reason || 'No reason provided',
    });

    // Send email notification to member about rejection
    const member = await findUserById(request.userId);
    const component = await findComponentById(request.componentId);
    if (member && member.email && component) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Request Rejected</h2>
          <p>Hi <strong>${member.name}</strong>,</p>
          <p>Your request for <strong>${component.name}</strong> has been rejected.</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0;"><strong>Component:</strong> ${component.name}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          </div>
          <p>You can request another component from the inventory.</p>
          <p style="color: #6b7280; font-size: 14px;">- Challengers Team</p>
        </div>
      `;
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: member.email,
        subject: `❌ Request Rejected: ${component.name}`,
        html: emailHtml,
      }).catch(err => console.error('Rejection email error:', err));
    }

    res.json({ message: 'Request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Cancel own request (Member)
// @route   DELETE /api/requests/:id
// @access  Private
const cancelRequest = async (req, res) => {
  try {
    const request = await findRequestById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check ownership
    if (request.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    await deleteRequest(req.params.id);
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  requestComponent,
  getRequests,
  approveRequest,
  rejectRequest,
  cancelRequest,
};
