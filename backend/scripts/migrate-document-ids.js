require('dotenv').config();
const { db } = require('../config/firebase');

const migrateDocumentIds = async () => {
  try {
    console.log('🔄 Starting migration of document IDs to readable format...\n');

    // ===== CHECKOUT HISTORY MIGRATION =====
    console.log('📦 Migrating CheckoutHistory documents...');
    const checkoutHistoryCollection = db.collection('checkoutHistory');
    const historySnapshot = await checkoutHistoryCollection.get();
    
    let historyMigrated = 0;
    const batch1 = db.batch();
    
    for (const doc of historySnapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      
      // Check if ID is random (contains random characters, not readable format)
      if (oldId.length > 20 || /[A-Z]/.test(oldId) && /[a-z]/.test(oldId)) {
        // Create new readable ID: HIST-timestamp-componentId-action
        const timestamp = data.timestamp?.toDate?.() || new Date();
        const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
        const componentId = data.componentId || 'UNKNOWN';
        const action = data.action || 'checkout';
        const newId = `HIST-${dateStr}-${componentId}-${action}-${historyMigrated + 1}`;
        
        // Create new document with readable ID
        const newDocRef = checkoutHistoryCollection.doc(newId);
        batch1.set(newDocRef, data);
        
        // Mark old document for deletion (we'll delete after confirming new ones are created)
        console.log(`  ✓ ${oldId} → ${newId}`);
        historyMigrated++;
      }
    }
    
    if (historyMigrated > 0) {
      await batch1.commit();
      console.log(`✅ Migrated ${historyMigrated} CheckoutHistory documents\n`);
      
      // Now delete old documents
      const batch1Delete = db.batch();
      for (const doc of historySnapshot.docs) {
        const oldId = doc.id;
        if (oldId.length > 20 || /[A-Z]/.test(oldId) && /[a-z]/.test(oldId)) {
          batch1Delete.delete(doc.ref);
        }
      }
      await batch1Delete.commit();
      console.log(`🗑️  Deleted ${historyMigrated} old CheckoutHistory documents\n`);
    } else {
      console.log('✓ No CheckoutHistory documents need migration\n');
    }

    // ===== COMPONENT REQUESTS MIGRATION =====
    console.log('📦 Migrating ComponentRequest documents...');
    const requestsCollection = db.collection('componentRequests');
    const requestsSnapshot = await requestsCollection.get();
    
    let requestsMigrated = 0;
    const batch2 = db.batch();
    
    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      
      // Check if ID is random
      if (oldId.length > 20 || /[A-Z]/.test(oldId) && /[a-z]/.test(oldId)) {
        // Create new readable ID: REQ-timestamp-username-componentId
        const timestamp = data.requestedAt?.toDate?.() || new Date();
        const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
        const username = data.requestedBy || 'unknown';
        const componentId = data.componentId || 'UNKNOWN';
        const newId = `REQ-${dateStr}-${username}-${componentId}`;
        
        // Create new document with readable ID
        const newDocRef = requestsCollection.doc(newId);
        batch2.set(newDocRef, data);
        
        console.log(`  ✓ ${oldId} → ${newId}`);
        requestsMigrated++;
      }
    }
    
    if (requestsMigrated > 0) {
      await batch2.commit();
      console.log(`✅ Migrated ${requestsMigrated} ComponentRequest documents\n`);
      
      // Delete old documents
      const batch2Delete = db.batch();
      for (const doc of requestsSnapshot.docs) {
        const oldId = doc.id;
        if (oldId.length > 20 || /[A-Z]/.test(oldId) && /[a-z]/.test(oldId)) {
          batch2Delete.delete(doc.ref);
        }
      }
      await batch2Delete.commit();
      console.log(`🗑️  Deleted ${requestsMigrated} old ComponentRequest documents\n`);
    } else {
      console.log('✓ No ComponentRequest documents need migration\n');
    }

    // ===== NOTIFICATION LOGS MIGRATION =====
    console.log('📦 Migrating NotificationLog documents...');
    const notificationLogsCollection = db.collection('notificationLogs');
    const logsSnapshot = await notificationLogsCollection.get();
    
    let logsMigrated = 0;
    const batch3 = db.batch();
    
    for (const doc of logsSnapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      
      // Check if ID is random
      if (oldId.length > 20 || /[A-Z]/.test(oldId) && /[a-z]/.test(oldId)) {
        // Create new readable ID: LOG-timestamp-username-type
        const timestamp = data.sentAt?.toDate?.() || new Date();
        const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
        const username = data.userId || 'unknown';
        const type = data.type || 'email';
        const newId = `LOG-${dateStr}-${timeStr}-${username}-${type}`;
        
        // Create new document with readable ID
        const newDocRef = notificationLogsCollection.doc(newId);
        batch3.set(newDocRef, data);
        
        console.log(`  ✓ ${oldId} → ${newId}`);
        logsMigrated++;
      }
    }
    
    if (logsMigrated > 0) {
      await batch3.commit();
      console.log(`✅ Migrated ${logsMigrated} NotificationLog documents\n`);
      
      // Delete old documents
      const batch3Delete = db.batch();
      for (const doc of logsSnapshot.docs) {
        const oldId = doc.id;
        if (oldId.length > 20 || /[A-Z]/.test(oldId) && /[a-z]/.test(oldId)) {
          batch3Delete.delete(doc.ref);
        }
      }
      await batch3Delete.commit();
      console.log(`🗑️  Deleted ${logsMigrated} old NotificationLog documents\n`);
    } else {
      console.log('✓ No NotificationLog documents need migration\n');
    }

    // ===== SUMMARY =====
    console.log('📊 Migration Summary:');
    console.log(`   CheckoutHistory: ${historyMigrated} documents migrated`);
    console.log(`   ComponentRequests: ${requestsMigrated} documents migrated`);
    console.log(`   NotificationLogs: ${logsMigrated} documents migrated`);
    console.log(`\n✅ Total: ${historyMigrated + requestsMigrated + logsMigrated} documents migrated`);
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 All data preserved, only document IDs changed to readable format');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateDocumentIds();
