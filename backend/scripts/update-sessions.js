require('dotenv').config();
const { db } = require('../config/firebase');

// Helper function to detect browser from user agent
const getBrowserName = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) return 'Opera';
  if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
  
  return 'Unknown';
};

// Helper function to detect platform from user agent
const getPlatform = (userAgent) => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Unknown';
};

const updateUserSessions = async () => {
  try {
    console.log('🔄 Updating UserSession documents...\n');

    const sessionsCollection = db.collection('userSessions');
    const snapshot = await sessionsCollection.get();
    
    console.log(`📊 Found ${snapshot.size} session documents\n`);
    
    let updated = 0;
    let browserFixed = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const oldId = doc.id;
      
      // Fix browser name if it's "Mozilla" or incorrect
      let needsBrowserFix = false;
      let updatedData = { ...data };
      
      if (data.deviceInfo?.browser === 'Mozilla' || data.deviceInfo?.browser === 'Unknown') {
        const correctBrowser = getBrowserName(data.userAgent);
        const correctPlatform = getPlatform(data.userAgent);
        updatedData.deviceInfo = {
          browser: correctBrowser,
          platform: correctPlatform
        };
        needsBrowserFix = true;
        console.log(`  🔧 Fixing browser: "${data.deviceInfo?.browser}" → "${correctBrowser}"`);
      }
      
      // Check if ID is random (garbage characters)
      const isGarbageId = oldId.length > 20 || (/[A-Z]/.test(oldId) && /[a-z]/.test(oldId) && oldId.length > 15);
      
      if (isGarbageId || needsBrowserFix) {
        let newId = oldId;
        
        if (isGarbageId) {
          // Create new readable ID: SESSION-date-time-username
          const timestamp = data.loginTime?.toDate?.() || new Date();
          const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
          const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '');
          const username = data.username || 'unknown';
          newId = `SESSION-${dateStr}-${timeStr}-${username}`;
          
          console.log(`  📝 Updating ID:`);
          console.log(`     Old: ${oldId}`);
          console.log(`     New: ${newId}`);
        }
        
        console.log(`     User: ${data.username}`);
        console.log(`     Browser: ${updatedData.deviceInfo?.browser || 'N/A'}`);
        console.log(`     Platform: ${updatedData.deviceInfo?.platform || 'N/A'}\n`);
        
        // Create/update document with new ID and fixed data
        if (newId !== oldId) {
          await sessionsCollection.doc(newId).set(updatedData);
          await doc.ref.delete();
          updated++;
        } else {
          // Just update the browser info
          await doc.ref.update({ deviceInfo: updatedData.deviceInfo });
          browserFixed++;
        }
      }
    }
    
    console.log(`✅ Migration Summary:`);
    if (updated > 0) console.log(`   - ${updated} session IDs migrated to readable format`);
    if (browserFixed > 0) console.log(`   - ${browserFixed} browser names fixed`);
    if (updated === 0 && browserFixed === 0) console.log(`   - All sessions already have proper IDs and browser names`);

    // Verify the changes
    console.log('\n📦 Current UserSession Documents:');
    const verifySnapshot = await sessionsCollection.orderBy('loginTime', 'desc').limit(10).get();
    verifySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const loginTime = data.loginTime?.toDate?.()?.toLocaleString() || 'N/A';
      console.log(`  ✓ ${doc.id}`);
      console.log(`    User: ${data.username}, Browser: ${data.deviceInfo?.browser}, Login: ${loginTime}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateUserSessions();
