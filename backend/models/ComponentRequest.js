const { db } = require('../config/firebase');

const requestsCollection = db.collection('componentRequests');

// Create component request
const createRequest = async (requestData) => {
  const docRef = await requestsCollection.add({
    ...requestData,
    status: 'pending', // pending, approved, rejected
    requestedAt: new Date(),
    respondedAt: null,
    respondedBy: null,
  });
  
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

// Find request by ID
const findRequestById = async (id) => {
  const doc = await requestsCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// Get all requests with filters
const getAllRequests = async (filter = {}) => {
  let query = requestsCollection;
  
  // Build filters array
  const filters = [];
  
  if (filter.status) {
    filters.push(['status', '==', filter.status]);
  }
  if (filter.userId) {
    filters.push(['userId', '==', filter.userId]);
  }
  if (filter.componentId) {
    filters.push(['componentId', '==', filter.componentId]);
  }
  
  // Apply all filters
  for (const [field, operator, value] of filters) {
    query = query.where(field, operator, value);
  }
  
  try {
    // Avoid composite index requirement by fetching without orderBy, then sort in memory
    const snapshot = await query.get();
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by requestedAt desc if present
    return results.sort((a, b) => {
      const aDate = a.requestedAt ? new Date(a.requestedAt.seconds ? a.requestedAt.toDate() : a.requestedAt) : 0;
      const bDate = b.requestedAt ? new Date(b.requestedAt.seconds ? b.requestedAt.toDate() : b.requestedAt) : 0;
      return bDate - aDate;
    });
  } catch (error) {
    console.error('Error in getAllRequests:', error);
    return [];
  }
};

// Get pending requests count
const getPendingRequestsCount = async () => {
  const snapshot = await requestsCollection.where('status', '==', 'pending').get();
  return snapshot.size;
};

// Update request
const updateRequest = async (id, updates) => {
  await requestsCollection.doc(id).update(updates);
  return findRequestById(id);
};

// Delete request
const deleteRequest = async (id) => {
  await requestsCollection.doc(id).delete();
};

// Delete all requests (for seeding)
const deleteAllRequests = async () => {
  const snapshot = await requestsCollection.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

module.exports = {
  createRequest,
  findRequestById,
  getAllRequests,
  getPendingRequestsCount,
  updateRequest,
  deleteRequest,
  deleteAllRequests,
};
