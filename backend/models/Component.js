const { db } = require('../config/firebase');

const componentsCollection = db.collection('components');

// Create component
const createComponent = async (componentData) => {
  const docRef = await componentsCollection.add({
    ...componentData,
    status: componentData.status || 'available',
    currentBorrower: componentData.currentBorrower || null,
    checkedOutAt: componentData.checkedOutAt || null,
    dueDate: componentData.dueDate || null,
    checkoutDuration: componentData.checkoutDuration || 7,
    description: componentData.description || '',
    imageUrl: componentData.imageUrl || '',
    createdAt: new Date(),
  });
  
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
};

// Find component by ID
const findComponentById = async (id) => {
  const doc = await componentsCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// Find component by componentId
const findComponentByComponentId = async (componentId) => {
  const snapshot = await componentsCollection.where('componentId', '==', componentId.toUpperCase()).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Get all components
const getAllComponents = async (filter = {}) => {
  let query = componentsCollection;
  
  if (filter.status) {
    query = query.where('status', '==', filter.status);
  }
  if (filter.category) {
    query = query.where('category', '==', filter.category);
  }
  if (filter.currentBorrower) {
    query = query.where('currentBorrower', '==', filter.currentBorrower);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update component
const updateComponent = async (id, updates) => {
  await componentsCollection.doc(id).update(updates);
  return findComponentById(id);
};

// Delete all components (for seeding)
const deleteAllComponents = async () => {
  const snapshot = await componentsCollection.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

// Get overdue components
const getOverdueComponents = async () => {
  const now = new Date();
  const snapshot = await componentsCollection
    .where('status', '==', 'taken')
    .get();
  
  const components = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return components.filter(comp => comp.dueDate && new Date(comp.dueDate.toDate ? comp.dueDate.toDate() : comp.dueDate) < now);
};

module.exports = {
  componentsCollection,
  createComponent,
  findComponentById,
  findComponentByComponentId,
  getAllComponents,
  updateComponent,
  deleteAllComponents,
  getOverdueComponents,
};

