require('dotenv').config();
const { db } = require('../config/firebase');
const { checkOverdueComponents } = require('../jobs/scheduler');

const testReminders = async () => {
  try {
    console.log('🧪 Setting up test reminder scenario...\n');

    // Get first available component
    const componentsSnapshot = await db.collection('components').limit(1).get();
    
    if (componentsSnapshot.empty) {
      console.log('❌ No components found. Run seed script first: node scripts/seed.js');
      process.exit(1);
    }

    const componentDoc = componentsSnapshot.docs[0];
    const component = { id: componentDoc.id, ...componentDoc.data() };

    console.log(`📦 Found component: ${component.name}`);

    // Get admin user for testing
    const usersSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No admin user found. Run seed script first.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    console.log(`👤 Testing with user: ${user.name} (${user.email})`);

    // Set component as checked out with due date YESTERDAY (overdue)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    await db.collection('components').doc(component.id).update({
      status: 'taken',
      currentBorrower: user.id,
      checkedOutAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      dueDate: yesterday, // Yesterday = 1 day overdue
    });

    console.log(`\n✅ Component "${component.name}" set as OVERDUE`);
    console.log(`📅 Due date: ${yesterday.toLocaleString()} (YESTERDAY)`);
    console.log(`📧 OVERDUE email will be sent to: ${user.email}`);
    
    console.log('\n⏳ Running reminder check...\n');
    
    // Trigger the reminder check
    await checkOverdueComponents();

    console.log('\n✅ Test complete! Check your email inbox.');
    console.log(`\nℹ️  To reset, either:`);
    console.log(`   1. Return the component via the website`);
    console.log(`   2. Run: node scripts/seed.js (resets all data)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testReminders();
