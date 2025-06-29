// Test comment creation
const http = require('http');

const postData = JSON.stringify({
  entryId: 5,
  comment: "Test comment from API"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/comments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // Add authentication cookie if needed
    'Cookie': 'auth_session=your_session_cookie_here'
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

req.write(postData);
req.end();
