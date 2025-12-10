require('dotenv').config();
const { db } = require('../config/firebase');

const updatePasswordResetIds = async () => {
  try {
    console.log('🔄 Updating passwordResets document IDs with user email...\n');

    const passwordResetsCollection = db.collection('passwordResets');
    const snapshot = await passwordResetsCollection.get();
    
    console.log(`📊 Found ${snapshot.size} password reset documents\n`);
    
    let updated = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      
      // Check if ID is random (garbage characters)
      if (oldId.length > 20 || (/[A-Z]/.test(oldId) && /[a-z]/.test(oldId) && /[0-9]/.test(oldId))) {
        // Get the user email from the document data
        const email = data.email || 'unknown';
        const timestamp = data.createdAt?.toDate?.() || new Date();
        const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
        
        // Create new readable ID: PWRESET-date-time-email
        const emailPart = email.split('@')[0]; // Get part before @
        const newId = `PWRESET-${dateStr}-${timeStr}-${emailPart}`;
        
        console.log(`  Updating: ${oldId}`);
        console.log(`  New ID:   ${newId}`);
        console.log(`  Email:    ${email}`);
        console.log(`  Code:     ${data.code}`);
        console.log(`  Expires:  ${data.expiresAt?.toDate?.()?.toLocaleString() || 'N/A'}\n`);
        
        // Create new document with proper ID
        await passwordResetsCollection.doc(newId).set(data);
        
        // Delete old document
        await doc.ref.delete();
        
        updated++;
      }
    }
    
    if (updated > 0) {
      console.log(`✅ Updated ${updated} passwordResets documents with user email`);
    } else {
      console.log('✓ All passwordResets documents already have proper IDs');
    }

    // Verify the changes
    console.log('\n📦 Current passwordResets Documents:');
    const verifySnapshot = await passwordResetsCollection.get();
    if (verifySnapshot.size === 0) {
      console.log('  (No active password reset requests)');
    } else {
      verifySnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  ✓ ${doc.id} (Email: ${data.email})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updatePasswordResetIds();
