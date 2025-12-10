const axios = require('axios');

const testRememberMe = async () => {
  try {
    console.log('🧪 Testing Remember Me functionality with Firebase storage...\n');
    
    // Test 1: Login with Remember Me = true
    console.log('Test 1: Login with Remember Me = TRUE');
    try {
      const response1 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'pranav',
        password: 'challengers@2025',
        rememberMe: true
      });
      console.log('✅ Login successful with Remember Me');
      console.log(`   User: ${response1.data.name}`);
      console.log(`   Session ID: ${response1.data.sessionId}`);
      console.log(`   Remember Me: ${response1.data.rememberMe}`);
      console.log(`   Token: ${response1.data.token.substring(0, 20)}...`);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Login with Remember Me = false
    console.log('Test 2: Login with Remember Me = FALSE');
    try {
      const response2 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'member1',
        password: 'challengers@2025',
        rememberMe: false
      });
      console.log('✅ Login successful without Remember Me');
      console.log(`   User: ${response2.data.name}`);
      console.log(`   Session ID: ${response2.data.sessionId}`);
      console.log(`   Remember Me: ${response2.data.rememberMe}`);
      console.log(`   Token: ${response2.data.token.substring(0, 20)}...`);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n---\n');
    
    // Test 3: Login with email and Remember Me
    console.log('Test 3: Login with EMAIL and Remember Me = TRUE');
    try {
      const response3 = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'pranavpavan641@gmail.com',
        password: 'challengers@2025',
        rememberMe: true
      });
      console.log('✅ Email login successful with Remember Me');
      console.log(`   User: ${response3.data.name}`);
      console.log(`   Session ID: ${response3.data.sessionId}`);
      console.log(`   Remember Me: ${response3.data.rememberMe}`);
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n💡 Check Firebase Console > Firestore > userSessions collection');
    console.log('   You should see session records with rememberMe, loginTime, deviceInfo, etc.');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
};

testRememberMe();
