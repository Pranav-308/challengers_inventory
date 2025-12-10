require('dotenv').config();
const { db } = require('../config/firebase');

const deleteAxiosSessions = async () => {
  try {
    console.log('🗑️  Deleting axios test sessions...\n');

    const sessionsCollection = db.collection('userSessions');
    const snapshot = await sessionsCollection.where('deviceInfo.browser', '==', 'axios').get();
    
    console.log(`📊 Found ${snapshot.size} axios sessions to delete\n`);
    
    let deleted = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log(`  🗑️  Deleting: ${doc.id}`);
      console.log(`     User: ${data.username}`);
      console.log(`     Login Time: ${data.loginTime?.toDate?.()?.toLocaleString()}\n`);
      
      await doc.ref.delete();
      deleted++;
    }

    console.log(`✅ Deleted ${deleted} axios test sessions\n`);

    // Verify the changes
    console.log('📦 Remaining UserSession Documents:');
    const verifySnapshot = await sessionsCollection.orderBy('loginTime', 'desc').get();
    
    if (verifySnapshot.size === 0) {
      console.log('  (No sessions)');
    } else {
      verifySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const loginTime = data.loginTime?.toDate?.()?.toLocaleString() || 'N/A';
        console.log(`  ✓ ${doc.id}`);
        console.log(`    User: ${data.username}, Browser: ${data.deviceInfo?.browser}, Login: ${loginTime}`);
      });
    }

    console.log(`\n✅ Database cleaned! Total sessions remaining: ${verifySnapshot.size}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deleteAxiosSessions();
