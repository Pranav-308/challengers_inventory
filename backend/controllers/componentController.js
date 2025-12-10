const { getAllComponents, findComponentById, updateComponent, findComponentByComponentId, createComponent: createComponentModel, getOverdueComponents: getOverdueComponentsModel } = require('../models/Component');
const { createHistory, getHistoryByComponent } = require('../models/CheckoutHistory');
const { findUserById } = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// @desc    Get all components
// @route   GET /api/components
// @access  Private
const getComponents = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    const components = await getAllComponents({ status, category, search });

    // Manually populate currentBorrower
    const componentsWithBorrower = await Promise.all(components.map(async (comp) => {
      if (comp.currentBorrower) {
        const borrower = await findUserById(comp.currentBorrower);
        if (borrower) {
          comp.currentBorrowerDetails = {
            id: borrower.id,
            name: borrower.name,
            username: borrower.username,
          };
        }
      }
      return comp;
    }));

    res.json(componentsWithBorrower);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single component
// @route   GET /api/components/:id
// @access  Private
const getComponent = async (req, res) => {
  try {
    const component = await findComponentById(req.params.id);

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Manually populate currentBorrower
    if (component.currentBorrower) {
      const borrower = await findUserById(component.currentBorrower);
      if (borrower) {
        component.currentBorrowerDetails = {
          id: borrower.id,
          name: borrower.name,
          username: borrower.username,
          email: borrower.email,
          phone: borrower.phone,
        };
      }
    }

    res.json(component);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Checkout component
// @route   POST /api/components/:id/checkout
// @access  Private
const checkoutComponent = async (req, res) => {
  try {
    const component = await findComponentById(req.params.id);

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    if (component.status !== 'available') {
      return res.status(400).json({ message: 'Component is not available' });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + component.checkoutDuration);

    // Update component
    const updatedComponent = await updateComponent(req.params.id, {
      status: 'taken',
      currentBorrower: req.user.id,
      checkedOutAt: new Date(),
      dueDate: dueDate,
    });

    // Create history record
    await createHistory({
      componentId: req.params.id,
      userId: req.user.id,
      action: 'checkout',
      notes: req.body.notes || '',
    });

    // Add borrower details for response
    updatedComponent.currentBorrowerDetails = {
      id: req.user.id,
      name: req.user.name,
      username: req.user.username,
    };

    // Send notifications (non-blocking)
    sendNotification(req.user, updatedComponent, 'checkout').catch(err => 
      console.error('Notification error:', err)
    );

    res.json(updatedComponent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Return component
// @route   POST /api/components/:id/return
// @access  Private
const returnComponent = async (req, res) => {
  try {
    const component = await findComponentById(req.params.id);

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    if (component.status === 'available') {
      return res.status(400).json({ message: 'Component is already available' });
    }

    // Verify user is the borrower or is admin
    if (component.currentBorrower !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You did not borrow this component' });
    }

    // Calculate duration
    const duration = Math.ceil((new Date() - new Date(component.checkedOutAt)) / (1000 * 60 * 60 * 24));

    // Store borrowerId before updating
    const borrowerId = component.currentBorrower;

    // Update component
    const updatedComponent = await updateComponent(req.params.id, {
      status: 'available',
      currentBorrower: null,
      checkedOutAt: null,
      dueDate: null,
    });

    // Create history record
    await createHistory({
      componentId: req.params.id,
      userId: borrowerId,
      action: 'return',
      notes: req.body.notes || '',
    });

    // Get borrower for notification
    const borrower = await findUserById(borrowerId);

    // Send notifications (non-blocking)
    if (borrower) {
      sendNotification(borrower, updatedComponent, 'return', { duration }).catch(err => 
        console.error('Notification error:', err)
      );
    }

    res.json(updatedComponent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get component history
// @route   GET /api/components/:id/history
// @access  Private
const getComponentHistory = async (req, res) => {
  try {
    const history = await getHistoryByComponent(req.params.id);

    // Manually populate user details
    const historyWithUsers = await Promise.all(history.map(async (record) => {
      const user = await findUserById(record.userId);
      if (user) {
        record.userDetails = {
          id: user.id,
          name: user.name,
          username: user.username,
        };
      }
      return record;
    }));

    res.json(historyWithUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new component (Admin only)
// @route   POST /api/components
// @access  Private/Admin
const createComponent = async (req, res) => {
  try {
    const { componentId, name, category, description, checkoutDuration, imageUrl } = req.body;

    // Check if component ID already exists
    const exists = await findComponentByComponentId(componentId.toUpperCase());
    if (exists) {
      return res.status(400).json({ message: 'Component ID already exists' });
    }

    const component = await createComponentModel({
      componentId: componentId.toUpperCase(),
      name,
      category,
      description,
      checkoutDuration: checkoutDuration || 7,
      imageUrl: imageUrl || '',
    });

    res.status(201).json(component);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get overdue components
// @route   GET /api/components/overdue/list
// @access  Private
const getOverdueComponents = async (req, res) => {
  try {
    const overdueComponents = await getOverdueComponentsModel();

    // Update status to overdue and populate borrower details
    const componentsWithBorrowers = await Promise.all(overdueComponents.map(async (component) => {
      if (component.status !== 'overdue') {
        await updateComponent(component.id, { status: 'overdue' });
        component.status = 'overdue';
      }

      if (component.currentBorrower) {
        const borrower = await findUserById(component.currentBorrower);
        if (borrower) {
          component.currentBorrowerDetails = {
            id: borrower.id,
            name: borrower.name,
            username: borrower.username,
            email: borrower.email,
            phone: borrower.phone,
            notificationPreferences: borrower.notificationPreferences,
          };
        }
      }

      return component;
    }));

    res.json(componentsWithBorrowers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload component image
// @route   POST /api/components/:id/upload-image
// @access  Private/Admin
const uploadComponentImage = async (req, res) => {
  try {
    const component = await findComponentById(req.params.id);

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Store relative path to image
    const imageUrl = `/uploads/components/${req.file.filename}`;

    await updateComponent(req.params.id, { imageUrl });

    res.json({
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getComponents,
  getComponent,
  checkoutComponent,
  returnComponent,
  getComponentHistory,
  createComponent,
  getOverdueComponents,
  uploadComponentImage,
};
