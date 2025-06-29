// Quick test script to verify API endpoints
import http from 'http';

async function testAPI() {
  try {
    // Test simple connection
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/entries',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
    });

    req.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();
