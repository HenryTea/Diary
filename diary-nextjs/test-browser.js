// Test what the browser is actually sending
const fetch = require('node-fetch');

async function testBrowserLikeRequest() {
  try {
    console.log('Testing request like browser would make...');
    
    const response = await fetch('http://localhost:3000/api/entries?page=1&limit=100', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    const data = await response.text();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testBrowserLikeRequest();
