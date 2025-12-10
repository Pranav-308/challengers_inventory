const emailService = require('./emailService');

// Send notification via email only
const sendNotification = async (user, component, type, extraData = {}) => {
  const results = {
    email: null,
  };

  // Send email if enabled
  if (user.notificationPreferences?.email !== false) {
    try {
      switch (type) {
        case 'checkout':
          results.email = await emailService.notifyCheckout(user, component);
          break;
        case 'return':
          results.email = await emailService.notifyReturn(user, component, extraData.duration);
          break;
        case 'overdue':
          results.email = await emailService.notifyOverdue(user, component, extraData.daysOverdue);
          break;
        case 'due_soon':
          results.email = await emailService.notifyDueSoon(user, component);
          break;
        case 'component_request':
          results.email = await emailService.notifyAdminRequest(
            user,
            extraData.member,
            component,
            extraData.notes,
            extraData.requestedDays
          );
          break;
      }
    } catch (error) {
      console.error('Email notification error:', error);
      results.email = { success: false, error: error.message };
    }
  }

  return results;
};

// Retry failed notifications
const retryFailedNotifications = async () => {
  const { getFailedNotifications, updateNotificationLog } = require('../models/NotificationLog');
  const { findUserById } = require('../models/User');
  const { findComponentById } = require('../models/Component');
  
  const failedLogs = await getFailedNotifications();
  const logsToRetry = failedLogs.slice(0, 10); // Limit to 10

  for (const log of logsToRetry) {
    if (!log.userId || !log.componentId) continue;

    const user = await findUserById(log.userId);
    const component = await findComponentById(log.componentId);

    if (!user || !component) continue;

    // Only retry email notifications
    if (log.channel !== 'email') continue;

    let result;

    try {
      switch (log.type) {
        case 'checkout':
          result = await emailService.notifyCheckout(user, component);
          break;
        case 'return':
          result = await emailService.notifyReturn(user, component, 0);
          break;
        case 'overdue_reminder':
          result = await emailService.notifyOverdue(user, component, 1);
          break;
        case 'due_soon':
          result = await emailService.notifyDueSoon(user, component);
          break;
      }

      if (result && result.success) {
        await updateNotificationLog(log.id, {
          status: 'sent',
          sentAt: new Date(),
          attempts: (log.attempts || 0) + 1,
        });
        console.log(`✅ Retry successful for ${log.channel} notification`);
      } else {
        await updateNotificationLog(log.id, {
          status: 'failed',
          attempts: (log.attempts || 0) + 1,
          errorMessage: result ? result.error : 'Unknown error',
        });
      }
    } catch (error) {
      await updateNotificationLog(log.id, {
        status: 'failed',
        attempts: (log.attempts || 0) + 1,
        errorMessage: error.message,
      });
      console.error(`❌ Retry failed for ${log.channel} notification:`, error);
    }
  }
};

// Send notification to all admins about component request
const notifyAdminsAboutRequest = async (member, component, notes, requestedDays) => {
  const { getAllUsers } = require('../models/User');
  
  try {
    // Get all admin users
    const allUsers = await getAllUsers();
    const admins = allUsers.filter(u => u.role === 'admin');

    if (admins.length === 0) {
      console.log('⚠️ No admin users found to notify');
      return;
    }

    // Send notifications to all admins
    for (const admin of admins) {
      await sendNotification(admin, component, 'component_request', {
        member,
        notes,
        requestedDays,
      });
      console.log(`📧 Notified admin ${admin.name} about component request`);
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};

module.exports = {
  sendNotification,
  retryFailedNotifications,
  notifyAdminsAboutRequest,
};
