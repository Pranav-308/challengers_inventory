require('dotenv').config();
const { db } = require('../config/firebase');

const checkSessions = async () => {
  try {
    console.log('🔍 Checking Firebase userSessions collection...\n');
    
    const sessionsCollection = db.collection('userSessions');
    const snapshot = await sessionsCollection.orderBy('loginTime', 'desc').limit(10).get();
    
    console.log(`📊 Found ${snapshot.size} recent sessions:\n`);
    
    snapshot.docs.forEach((doc, index) => {
      const session = doc.data();
      console.log(`Session ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Username: ${session.username}`);
      console.log(`  User ID: ${session.userId}`);
      console.log(`  Remember Me: ${session.rememberMe ? '✅ YES' : '❌ NO'}`);
      console.log(`  Login Time: ${session.loginTime?.toDate().toLocaleString()}`);
      console.log(`  Expires At: ${session.expiresAt?.toDate().toLocaleString()}`);
      console.log(`  Is Active: ${session.isActive ? '🟢 Active' : '🔴 Inactive'}`);
      console.log(`  IP Address: ${session.ipAddress || 'N/A'}`);
      console.log(`  Device: ${session.deviceInfo?.browser || 'Unknown'}`);
      console.log(`  Platform: ${session.deviceInfo?.platform || 'Unknown'}`);
      console.log('  ---');
    });
    
    // Count active sessions
    const activeSnapshot = await sessionsCollection.where('isActive', '==', true).get();
    console.log(`\n🟢 Active sessions: ${activeSnapshot.size}`);
    
    // Count by rememberMe
    const rememberMeSnapshot = await sessionsCollection.where('rememberMe', '==', true).get();
    console.log(`✅ Sessions with Remember Me: ${rememberMeSnapshot.size}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkSessions();
