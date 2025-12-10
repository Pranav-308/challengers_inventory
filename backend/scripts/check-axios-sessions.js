require('dotenv').config();
const { db } = require('../config/firebase');

const checkAxiosSessions = async () => {
  try {
    console.log('🔍 Checking UserSession documents with "axios" browser...\n');

    const sessionsCollection = db.collection('userSessions');
    const snapshot = await sessionsCollection.where('deviceInfo.browser', '==', 'axios').get();
    
    console.log(`📊 Found ${snapshot.size} sessions with "axios" browser\n`);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Session ID: ${doc.id}`);
      console.log(`  Username: ${data.username}`);
      console.log(`  User Agent: ${data.userAgent}`);
      console.log(`  Browser: ${data.deviceInfo?.browser}`);
      console.log(`  Platform: ${data.deviceInfo?.platform}`);
      console.log(`  IP Address: ${data.ipAddress}`);
      console.log(`  Login Time: ${data.loginTime?.toDate?.()?.toLocaleString()}\n`);
    });

    console.log('💡 What is "axios"?');
    console.log('   "axios" appears in test scripts that use the axios HTTP library');
    console.log('   These are NOT real browser sessions - they are automated test requests');
    console.log('   You can safely delete these sessions or ignore them\n');

    console.log('📋 These sessions came from:');
    console.log('   - test-remember-me.js');
    console.log('   - test-email-login.js');
    console.log('   - Other backend test scripts\n');

    console.log('✅ Real browser sessions will show:');
    console.log('   - Chrome, Firefox, Safari, Edge, Opera, etc.');
    console.log('   - NOT "axios" or "Mozilla"\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkAxiosSessions();
