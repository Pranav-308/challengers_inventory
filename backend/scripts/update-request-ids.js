require('dotenv').config();
const { db } = require('../config/firebase');

const updateRequestIds = async () => {
  try {
    console.log('🔄 Updating ComponentRequest document IDs with proper userId...\n');

    const requestsCollection = db.collection('componentRequests');
    const snapshot = await requestsCollection.get();
    
    let updated = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      
      // Check if ID contains "unknown"
      if (oldId.includes('unknown')) {
        // Get the actual userId from the document data
        const userId = data.requestedBy || data.userId || 'guest';
        const timestamp = data.requestedAt?.toDate?.() || new Date();
        const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
        const componentId = data.componentId || 'UNKNOWN';
        
        // Create new ID with actual userId
        const newId = `REQ-${dateStr}-${userId}-${componentId}`;
        
        console.log(`  Updating: ${oldId}`);
        console.log(`  New ID:   ${newId}`);
        console.log(`  User:     ${userId}`);
        console.log(`  Component: ${componentId}\n`);
        
        // Create new document with proper ID
        await requestsCollection.doc(newId).set(data);
        
        // Delete old document
        await doc.ref.delete();
        
        updated++;
      }
    }
    
    if (updated > 0) {
      console.log(`✅ Updated ${updated} ComponentRequest documents with proper userId`);
    } else {
      console.log('✓ All ComponentRequest documents already have proper IDs');
    }

    // Verify the changes
    console.log('\n📦 Current ComponentRequest Documents:');
    const verifySnapshot = await requestsCollection.get();
    verifySnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  ✓ ${doc.id} (User: ${data.requestedBy || data.userId})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateRequestIds();
