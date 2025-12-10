const { db } = require('../config/firebase');

const notificationLogsCollection = db.collection('notificationLogs');

// Create notification log
const createNotificationLog = async (logData) => {
  const docRef = await notificationLogsCollection.add({
    ...logData,
    status: logData.status || 'pending',
    attempts: logData.attempts || 0,
    errorMessage: logData.errorMessage || '',
    sentAt: logData.sentAt || null,
    createdAt: new Date(),
  });
  
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

// Update notification log
const updateNotificationLog = async (id, updates) => {
  await notificationLogsCollection.doc(id).update(updates);
  const doc = await notificationLogsCollection.doc(id).get();
  return { id: doc.id, ...doc.data() };
};

// Get failed notifications
const getFailedNotifications = async () => {
  const snapshot = await notificationLogsCollection
    .where('status', '==', 'failed')
    .where('attempts', '<', 3)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get user notification logs
const getUserNotificationLogs = async (userId) => {
  const snapshot = await notificationLogsCollection
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  notificationLogsCollection,
  createNotificationLog,
  updateNotificationLog,
  getFailedNotifications,
  getUserNotificationLogs,
};

