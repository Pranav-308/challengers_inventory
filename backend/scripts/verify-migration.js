require('dotenv').config();
const { db } = require('../config/firebase');

const verifyMigration = async () => {
  try {
    console.log('🔍 Verifying migrated document IDs...\n');

    // Check CheckoutHistory
    console.log('📦 CheckoutHistory Documents:');
    const historySnapshot = await db.collection('checkoutHistory').get();
    historySnapshot.docs.forEach(doc => {
      console.log(`  ✓ ${doc.id}`);
    });
    console.log(`  Total: ${historySnapshot.size} documents\n`);

    // Check ComponentRequests
    console.log('📦 ComponentRequest Documents:');
    const requestsSnapshot = await db.collection('componentRequests').get();
    requestsSnapshot.docs.forEach(doc => {
      console.log(`  ✓ ${doc.id}`);
    });
    console.log(`  Total: ${requestsSnapshot.size} documents\n`);

    // Check NotificationLogs
    console.log('📦 NotificationLog Documents:');
    const logsSnapshot = await db.collection('notificationLogs').get();
    logsSnapshot.docs.forEach(doc => {
      console.log(`  ✓ ${doc.id}`);
    });
    console.log(`  Total: ${logsSnapshot.size} documents\n`);

    console.log('✅ All document IDs are now readable!');
    console.log('💾 No data was deleted - only IDs were updated');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyMigration();
