const nodemailer = require('nodemailer');
const { createNotificationLog, updateNotificationLog } = require('../models/NotificationLog');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Helper function to safely format dates
const formatDate = (date) => {
  if (!date) return 'Not set';
  
  // Handle Firestore Timestamp
  if (date && date.toDate) {
    date = date.toDate();
  }
  
  // Handle string dates
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // Check if valid date
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Not set';
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Send email with retry logic
const sendEmail = async (to, subject, html, userId, componentId, type) => {
  const logEntry = await createNotificationLog({
    userId,
    componentId,
    type,
    channel: 'email',
    status: 'pending',
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    await updateNotificationLog(logEntry.id, {
      status: 'sent',
      sentAt: new Date(),
    });

    console.log(`✅ Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    await updateNotificationLog(logEntry.id, {
      status: 'failed',
      attempts: (logEntry.attempts || 0) + 1,
      errorMessage: error.message,
    });

    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  checkout: (userName, componentName, dueDate) => ({
    subject: `✅ Component Checked Out: ${componentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h2 style="color: white; margin: 0;">✅ Component Checked Out</h2>
        </div>
        <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
        <p>You have successfully checked out the following component:</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #3b82f6;">
          <p style="margin: 8px 0; font-size: 18px;"><strong>📦 Component:</strong> ${componentName}</p>
          <p style="margin: 8px 0; font-size: 18px;"><strong>📅 Due Date:</strong> <span style="color: #ef4444; font-weight: bold;">${formatDate(dueDate)}</span></p>
        </div>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>⏰ Reminder Schedule:</strong></p>
          <ul style="color: #92400e; margin: 10px 0;">
            <li>You'll receive a reminder <strong>1 day before</strong> due date</li>
            <li>Another reminder on the <strong>due date</strong></li>
            <li>Daily reminders if overdue</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #64748b;">Please return the component on time to help other team members access it.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Challengers Component Tracker • Keep track, stay organized</p>
      </div>
    `,
  }),

  return: (userName, componentName, duration) => ({
    subject: `✅ Component Returned: ${componentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Component Returned Successfully</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Thank you for returning the component:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Component:</strong> ${componentName}</p>
          <p style="margin: 5px 0;"><strong>Borrowed for:</strong> ${duration} days</p>
        </div>
        <p>The component is now available for other team members.</p>
        <p style="color: #6b7280; font-size: 14px;">- Challengers Team</p>
      </div>
    `,
  }),

  overdue: (userName, componentName, daysOverdue) => ({
    subject: `🚨 URGENT: ${componentName} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} OVERDUE`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">
          <h2 style="color: white; margin: 0; font-size: 28px;">🚨 COMPONENT OVERDUE</h2>
        </div>
        <p style="font-size: 16px;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 16px; color: #991b1b;"><strong>URGENT:</strong> The following component is now overdue and needs to be returned immediately:</p>
        <div style="background: #fef2f2; padding: 25px; border-radius: 12px; margin: 25px 0; border: 3px solid #ef4444; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.2);">
          <p style="margin: 10px 0; font-size: 20px;"><strong>📦 Component:</strong> <span style="color: #dc2626;">${componentName}</span></p>
          <p style="margin: 10px 0; font-size: 24px;"><strong>⏱️ Days Overdue:</strong> <span style="color: #ef4444; font-weight: bold; background: #fee2e2; padding: 5px 15px; border-radius: 6px;">${daysOverdue}</span></p>
        </div>
        <div style="background: #fef3c7; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 5px solid #f59e0b;">
          <p style="margin: 0; color: #78350f; font-size: 15px;"><strong>⚠️ Important:</strong></p>
          <ul style="color: #78350f; margin: 10px 0; font-size: 14px;">
            <li>Other team members may need this component</li>
            <li>Please return it as soon as possible</li>
            <li>You will receive daily reminders until returned</li>
            <li>Contact admin if you need an extension</li>
          </ul>
        </div>
        <p style="font-size: 15px; color: #475569;">Thank you for your prompt attention to this matter.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">Challengers Component Tracker • Keep track, stay organized</p>
      </div>
    `,
  }),

  dueSoon: (userName, componentName, dueDate) => ({
    subject: `⏰ Reminder: ${componentName} Due Soon`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Component Due Soon</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>This is a friendly reminder that your component is due tomorrow:</p>
        <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Component:</strong> ${componentName}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(dueDate)}</p>
        </div>
        <p>Please return the component on time to avoid overdue notifications.</p>
        <p style="color: #6b7280; font-size: 14px;">- Challengers Team</p>
      </div>
    `,
  }),

  componentRequest: (adminName, memberName, componentName, notes, requestedDays) => ({
    subject: `🔔 New Component Request from ${memberName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">New Component Request</h2>
        <p>Hi <strong>${adminName}</strong>,</p>
        <p><strong>${memberName}</strong> has requested a component from the inventory:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
          <p style="margin: 5px 0;"><strong>Component:</strong> ${componentName}</p>
          <p style="margin: 5px 0;"><strong>Requested by:</strong> ${memberName}</p>
          <p style="margin: 5px 0;"><strong>Requested Duration:</strong> ${requestedDays} days</p>
          ${notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>
        <p>Please review and approve/reject this request from the admin portal.</p>
        <p style="color: #6b7280; font-size: 14px;">- Challengers Component Tracker</p>
      </div>
    `,
  }),
};

// Main notification functions
const notifyCheckout = async (user, component) => {
  const { subject, html } = emailTemplates.checkout(
    user.name,
    component.name,
    component.dueDate
  );
  return await sendEmail(user.email, subject, html, user.id || user._id, component.id || component._id, 'checkout');
};

const notifyReturn = async (user, component, duration) => {
  const { subject, html } = emailTemplates.return(user.name, component.name, duration);
  return await sendEmail(user.email, subject, html, user.id || user._id, component.id || component._id, 'return');
};

const notifyOverdue = async (user, component, daysOverdue) => {
  const { subject, html } = emailTemplates.overdue(user.name, component.name, daysOverdue);
  return await sendEmail(user.email, subject, html, user.id || user._id, component.id || component._id, 'overdue_reminder');
};

const notifyDueSoon = async (user, component) => {
  const { subject, html } = emailTemplates.dueSoon(user.name, component.name, component.dueDate);
  return await sendEmail(user.email, subject, html, user.id || user._id, component.id || component._id, 'due_soon');
};

const notifyAdminRequest = async (admin, member, component, notes, requestedDays) => {
  const { subject, html } = emailTemplates.componentRequest(
    admin.name,
    member.name,
    component.name,
    notes,
    requestedDays
  );
  return await sendEmail(admin.email, subject, html, member.id || member._id, component.id || component._id, 'component_request');
};

module.exports = {
  notifyCheckout,
  notifyReturn,
  notifyOverdue,
  notifyDueSoon,
  notifyAdminRequest,
};
