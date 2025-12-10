const twilio = require('twilio');
const { createNotificationLog, updateNotificationLog } = require('../models/NotificationLog');

// Initialize Twilio client (only if credentials are provided)
const hasValidCredentials = 
  process.env.TWILIO_ACCOUNT_SID && 
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID.startsWith('AC') &&
  !process.env.TWILIO_ACCOUNT_SID.includes('your_');

const client = hasValidCredentials
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Send WhatsApp message with retry logic
const sendWhatsApp = async (to, message, userId, componentId, type) => {
  // If Twilio is not configured, skip silently
  if (!client) {
    console.log('⚠️  WhatsApp not configured - skipping notification');
    return { success: false, error: 'WhatsApp service not configured' };
  }

  const logEntry = await createNotificationLog({
    userId,
    componentId,
    type,
    channel: 'whatsapp',
    status: 'pending',
  });

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message,
    });

    await updateNotificationLog(logEntry.id, {
      status: 'sent',
      sentAt: new Date(),
    });

    console.log(`✅ WhatsApp sent to ${to}`);
    return { success: true };
  } catch (error) {
    await updateNotificationLog(logEntry.id, {
      status: 'failed',
      attempts: (logEntry.attempts || 0) + 1,
      errorMessage: error.message,
    });

    console.error(`❌ WhatsApp failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// WhatsApp message templates
const whatsappTemplates = {
  checkout: (userName, componentName, dueDate) =>
    `✅ *Component Checked Out*\n\nHi ${userName},\n\nYou checked out: *${componentName}*\nDue Date: ${new Date(dueDate).toLocaleDateString()}\n\nPlease return on time!\n\n- Challengers Team`,

  return: (userName, componentName, duration) =>
    `✅ *Component Returned*\n\nHi ${userName},\n\nThank you for returning: *${componentName}*\nBorrowed for: ${duration} days\n\nComponent is now available for others.\n\n- Challengers Team`,

  overdue: (userName, componentName, daysOverdue) =>
    `⚠️ *Component Overdue*\n\nHi ${userName},\n\n*${componentName}* is overdue by *${daysOverdue} days*!\n\nPlease return it ASAP.\n\n- Challengers Team`,

  dueSoon: (userName, componentName, dueDate) =>
    `⏰ *Reminder: Due Tomorrow*\n\nHi ${userName},\n\n*${componentName}* is due on ${new Date(dueDate).toLocaleDateString()}\n\nPlease return on time!\n\n- Challengers Team`,
};

// Main notification functions
const notifyCheckout = async (user, component) => {
  const message = whatsappTemplates.checkout(user.name, component.name, component.dueDate);
  return await sendWhatsApp(user.phone, message, user.id || user._id, component.id || component._id, 'checkout');
};

const notifyReturn = async (user, component, duration) => {
  const message = whatsappTemplates.return(user.name, component.name, duration);
  return await sendWhatsApp(user.phone, message, user.id || user._id, component.id || component._id, 'return');
};

const notifyOverdue = async (user, component, daysOverdue) => {
  const message = whatsappTemplates.overdue(user.name, component.name, daysOverdue);
  return await sendWhatsApp(user.phone, message, user.id || user._id, component.id || component._id, 'overdue_reminder');
};

const notifyDueSoon = async (user, component) => {
  const message = whatsappTemplates.dueSoon(user.name, component.name, component.dueDate);
  return await sendWhatsApp(user.phone, message, user.id || user._id, component.id || component._id, 'due_soon');
};

const notifyAdminRequest = async (admin, member, component, notes, requestedDays) => {
  const message = `🔔 *New Component Request*\n\nHi ${admin.name},\n\n${member.name} has requested:\n📦 *Component:* ${component.name}\n👤 *Requested by:* ${member.name}\n⏱️ *Duration:* ${requestedDays} days${notes ? `\n📝 *Notes:* ${notes}` : ''}\n\nPlease review in the admin portal.\n\n- Challengers Team`;
  
  return await sendWhatsApp(admin.phone, message, member.id || member._id, component.id || component._id, 'component_request');
};

module.exports = {
  notifyCheckout,
  notifyReturn,
  notifyOverdue,
  notifyDueSoon,
  notifyAdminRequest,
};
