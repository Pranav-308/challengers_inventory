const cron = require('node-cron');
const { getAllComponents, updateComponent } = require('../models/Component');
const { findUserById } = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// Check for overdue components and send notifications
const checkOverdueComponents = async () => {
  try {
    console.log('🔍 Checking for overdue components...');

    const now = new Date();
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    const allComponents = await getAllComponents({});

    // Find components due soon (tomorrow)
    const dueSoonComponents = allComponents.filter(comp => {
      if (comp.status !== 'taken' || !comp.dueDate) return false;
      const dueDate = new Date(comp.dueDate);
      return dueDate >= now && dueDate <= oneDayFromNow;
    });

    for (const component of dueSoonComponents) {
      if (component.currentBorrower) {
        const borrower = await findUserById(component.currentBorrower);
        if (borrower) {
          console.log(`⏰ Sending due soon notification for ${component.name}`);
          await sendNotification(borrower, component, 'due_soon');
        }
      }
    }

    // Find overdue components
    const overdueComponents = allComponents.filter(comp => {
      if (!comp.dueDate) return false;
      const dueDate = new Date(comp.dueDate);
      return (comp.status === 'taken' || comp.status === 'overdue') && dueDate < now;
    });

    for (const component of overdueComponents) {
      // Update status to overdue
      if (component.status !== 'overdue') {
        await updateComponent(component.id, { status: 'overdue' });
      }

      if (component.currentBorrower) {
        const borrower = await findUserById(component.currentBorrower);
        if (borrower) {
          const daysOverdue = Math.ceil((now - new Date(component.dueDate)) / (1000 * 60 * 60 * 24));
          console.log(`⚠️ Sending overdue notification for ${component.name} (${daysOverdue} days)`);
          
          await sendNotification(borrower, component, 'overdue', { daysOverdue });
        }
      }
    }

    console.log(`✅ Overdue check complete. Due soon: ${dueSoonComponents.length}, Overdue: ${overdueComponents.length}`);
  } catch (error) {
    console.error('❌ Error in overdue check:', error);
  }
};

// Retry failed notifications
const { retryFailedNotifications } = require('../services/notificationService');

// Schedule jobs
const startCronJobs = () => {
  // Run overdue check twice daily at 9:00 AM and 6:00 PM
  cron.schedule('0 9,18 * * *', () => {
    console.log('🕐 Running scheduled overdue check...');
    checkOverdueComponents();
  });

  // Retry failed notifications every hour
  cron.schedule('0 * * * *', () => {
    console.log('🔄 Retrying failed notifications...');
    retryFailedNotifications();
  });

  // Run immediate check on startup
  console.log('🚀 Running initial overdue check...');
  checkOverdueComponents();

  console.log('✅ Cron jobs started');
  console.log('   - Overdue check: Twice daily at 9:00 AM and 6:00 PM');
  console.log('   - Retry notifications: Hourly');
  console.log('   - Initial check: Completed');
};

module.exports = {
  startCronJobs,
  checkOverdueComponents,
};
