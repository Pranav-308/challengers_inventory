const axios = require('axios');

const testEmailLogin = async () => {
  try {
    console.log('🧪 Testing email login functionality...\n');
    
    // Test 1: Login with username
    console.log('Test 1: Login with username "pranav"');
    try {
      const response1 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'pranav',
        password: 'challengers@2025'
      });
      console.log('✅ Username login successful');
      console.log(`   Logged in as: ${response1.data.name} (${response1.data.role})`);
    } catch (error) {
      console.log('❌ Username login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Login with email
    console.log('Test 2: Login with email "pranavpavan308@gmail.com"');
    try {
      const response2 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'pranavpavan308@gmail.com', // Backend accepts this in 'username' field
        password: 'challengers@2025'
      });
      console.log('✅ Email login successful');
      console.log(`   Logged in as: ${response2.data.name} (${response2.data.role})`);
    } catch (error) {
      console.log('❌ Email login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 3: Login with member username
    console.log('Test 3: Login with member username "member1"');
    try {
      const response3 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'member1',
        password: 'challengers@2025'
      });
      console.log('✅ Member username login successful');
      console.log(`   Logged in as: ${response3.data.name} (${response3.data.role})`);
    } catch (error) {
      console.log('❌ Member username login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 4: Login with member email
    console.log('Test 4: Login with member email "pranavpavan641@gmail.com"');
    try {
      const response4 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'pranavpavan641@gmail.com',
        password: 'challengers@2025'
      });
      console.log('✅ Member email login successful');
      console.log(`   Logged in as: ${response4.data.name} (${response4.data.role})`);
    } catch (error) {
      console.log('❌ Member email login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 All tests completed!\n');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
};

testEmailLogin();
