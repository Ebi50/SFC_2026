const testAPI = async () => {
  try {
    console.log('Testing API endpoints...');
    
    const response = await fetch('http://localhost:3001/api/settings');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Settings API working:', data);
    } else {
      console.log('❌ Settings API failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testAPI();