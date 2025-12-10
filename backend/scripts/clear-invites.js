require('dotenv').config();
const { db } = require('../config/firebase');

const clearOldData = async () => {
  try {
    console.log('🧹 Clearing old data with random IDs...');
    
    // Clear invites
    const invitesSnapshot = await db.collection('invites').get();
    console.log(`Found ${invitesSnapshot.size} invite(s)`);
    
    // Clear password resets
    const resetsSnapshot = await db.collection('passwordResets').get();
    console.log(`Found ${resetsSnapshot.size} password reset(s)`);
    
    // Clear notification logs
    const logsSnapshot = await db.collection('notificationLogs').get();
    console.log(`Found ${logsSnapshot.size} notification log(s)`);
    
    const batch = db.batch();
    
    invitesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    resetsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    logsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    
    console.log(`✅ Cleared all old records`);
    console.log('✨ New records will use readable IDs (usernames)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearOldData();
