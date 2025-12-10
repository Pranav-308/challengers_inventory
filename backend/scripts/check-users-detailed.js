require('dotenv').config();
const { db } = require('../config/firebase');

const checkUserDetails = async () => {
  try {
    console.log('👥 Users Collection - Detailed View\n');
    console.log('=' .repeat(80));

    const usersCollection = db.collection('users');
    const snapshot = await usersCollection.get();
    
    console.log(`\n📊 Total Users: ${snapshot.size}\n`);

    snapshot.docs.forEach((doc, index) => {
      const user = doc.data();
      
      console.log(`\n${index + 1}. Document ID: ${doc.id}`);
      console.log('   ' + '-'.repeat(70));
      console.log(`   Username:     ${user.username}`);
      console.log(`   Name:         ${user.name}`);
      console.log(`   Email:        ${user.email}`);
      console.log(`   Phone:        ${user.phone || 'N/A'}`);
      console.log(`   Role:         ${user.role} ${user.role === 'admin' ? '👑' : '👤'}`);
      console.log(`   Password:     ${user.password ? '[HASHED]' : 'N/A'}`);
      console.log(`   Created At:   ${user.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}`);
      console.log(`   Last Login:   ${user.lastLogin?.toDate?.()?.toLocaleString() || 'Never'}`);
      console.log(`   Last IP:      ${user.lastLoginIp || 'N/A'}`);
      
      if (user.notificationPreferences) {
        console.log(`   Notifications:`);
        console.log(`     Email:      ${user.notificationPreferences.email ? '✅' : '❌'}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Users Collection Structure:');
    console.log('   - Document ID: username (e.g., "pranav", "member1")');
    console.log('   - username: User\'s login username');
    console.log('   - name: Full name of the user');
    console.log('   - email: Email address (for notifications & login)');
    console.log('   - phone: Phone number (for WhatsApp - if enabled)');
    console.log('   - role: "admin" or "member"');
    console.log('   - password: Bcrypt hashed password');
    console.log('   - createdAt: Account creation timestamp');
    console.log('   - lastLogin: Last successful login timestamp');
    console.log('   - lastLoginIp: IP address of last login');
    console.log('   - notificationPreferences: { email: true/false }');

    console.log('\n🔐 Roles:');
    console.log('   👑 admin  - Can manage users, components, approve requests');
    console.log('   👤 member - Can checkout/return components, make requests');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUserDetails();
