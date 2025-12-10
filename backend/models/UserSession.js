const { db } = require('../config/firebase');

const userSessionsCollection = db.collection('userSessions');

// Create a new login session
const createSession = async (sessionData) => {
  const session = {
    userId: sessionData.userId,
    username: sessionData.username,
    loginTime: new Date(),
    rememberMe: sessionData.rememberMe || false,
    ipAddress: sessionData.ipAddress || null,
    userAgent: sessionData.userAgent || null,
    deviceInfo: sessionData.deviceInfo || null,
    expiresAt: sessionData.rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    isActive: true,
  };
  
  // Use userId as document ID for easy tracking
  const docRef = await userSessionsCollection.add(session);
  return { id: docRef.id, ...session };
};

// Get active sessions for a user
const getActiveSessions = async (userId) => {
  const snapshot = await userSessionsCollection
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .orderBy('loginTime', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// End a session (logout)
const endSession = async (sessionId) => {
  await userSessionsCollection.doc(sessionId).update({
    isActive: false,
    logoutTime: new Date(),
  });
};

// End all sessions for a user
const endAllUserSessions = async (userId) => {
  const snapshot = await userSessionsCollection
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      isActive: false,
      logoutTime: new Date(),
    });
  });
  await batch.commit();
};

// Clean up expired sessions (can be run as a cron job)
const cleanExpiredSessions = async () => {
  const now = new Date();
  const snapshot = await userSessionsCollection
    .where('expiresAt', '<', now)
    .where('isActive', '==', true)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      isActive: false,
      logoutTime: now,
    });
  });
  await batch.commit();
  
  return snapshot.size;
};

// Update last activity time
const updateLastActivity = async (sessionId) => {
  await userSessionsCollection.doc(sessionId).update({
    lastActivity: new Date(),
  });
};

module.exports = {
  userSessionsCollection,
  createSession,
  getActiveSessions,
  endSession,
  endAllUserSessions,
  cleanExpiredSessions,
  updateLastActivity,
};
