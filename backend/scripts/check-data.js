require('dotenv').config();
const { getAllComponents } = require('../models/Component');
const { getAllUsers } = require('../models/User');

const checkData = async () => {
  try {
    console.log('🔍 Checking Firestore data...\n');

    const components = await getAllComponents();
    console.log(`📦 Components found: ${components.length}`);
    if (components.length > 0) {
      console.log('First component:', JSON.stringify(components[0], null, 2));
    }

    const users = await getAllUsers();
    console.log(`\n👥 Users found: ${users.length}`);
    if (users.length > 0) {
      console.log('First user:', JSON.stringify({ 
        id: users[0].id, 
        username: users[0].username, 
        name: users[0].name,
        role: users[0].role 
      }, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkData();
