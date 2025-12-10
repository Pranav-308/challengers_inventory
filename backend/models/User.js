const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

const usersCollection = db.collection('users');

// Helper function to create user
const createUser = async (userData) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  userData.password = await bcrypt.hashSync(userData.password, salt);
  
  // Use username as document ID for better readability
  const userId = userData.username.toLowerCase();
  
  // Add user to Firestore with custom ID
  await usersCollection.doc(userId).set({
    ...userData,
    username: userData.username.toLowerCase(),
    createdAt: new Date(),
    lastLogin: null,
    lastLoginIp: null,
  });
  
  const doc = await usersCollection.doc(userId).get();
  return { id: doc.id, ...doc.data() };
};

// Find user by username
const findUserByUsername = async (username) => {
  const snapshot = await usersCollection.where('username', '==', username.toLowerCase()).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Find user by email
const findUserByEmail = async (email) => {
  const snapshot = await usersCollection.where('email', '==', email.toLowerCase()).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// Find user by ID
const findUserById = async (id) => {
  const doc = await usersCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

// Update user
const updateUser = async (id, updates) => {
  await usersCollection.doc(id).update(updates);
  return findUserById(id);
};

// Delete all users (for seeding)
const deleteAllUsers = async () => {
  const snapshot = await usersCollection.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

// Compare password
const comparePassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

// Get all users
const getAllUsers = async () => {
  const snapshot = await usersCollection.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  usersCollection,
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteAllUsers,
  comparePassword,
  getAllUsers,
};

