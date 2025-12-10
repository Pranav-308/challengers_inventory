const { db } = require('../config/firebase');

const historyCollection = db.collection('checkoutHistory');

// Create history entry
const createHistory = async (historyData) => {
  const docRef = await historyCollection.add({
    ...historyData,
    timestamp: historyData.timestamp || new Date(),
    notes: historyData.notes || '',
    createdAt: new Date(),
  });
  
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

// Get history by component ID
const getHistoryByComponent = async (componentId) => {
  const snapshot = await historyCollection
    .where('componentId', '==', componentId)
    .orderBy('timestamp', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get history by user ID
const getHistoryByUser = async (userId) => {
  const snapshot = await historyCollection
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get all history
const getAllHistory = async () => {
  const snapshot = await historyCollection.orderBy('timestamp', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Delete all history (for seeding)
const deleteAllHistory = async () => {
  const snapshot = await historyCollection.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

module.exports = {
  historyCollection,
  createHistory,
  getHistoryByComponent,
  getHistoryByUser,
  getAllHistory,
  deleteAllHistory,
};

