require('dotenv').config();
const { getAllUsers } = require('../models/User');

const checkUsers = async () => {
  try {
    console.log('👥 Fetching all users...\n');
    
    const users = await getAllUsers();
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`---`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();
