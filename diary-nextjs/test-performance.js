// Performance test script for Railway-to-Vercel optimization
// Run this in your browser console on the diary app to test API performance

async function testAPIPerformance() {
  console.log('🔄 Testing API Performance...\n');
  
  const tests = [
    {
      name: '🏥 Health Check',
      url: '/api/health',
      method: 'GET'
    },
    {
      name: '📋 Fetch Specific Entry',
      url: '/api/entries?id=1',
      method: 'GET'
    },
    {
      name: '📋 Fetch Recent Entries',
      url: '/api/entries?page=1&limit=5',
      method: 'GET'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const startTime = performance.now();
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      
      const endTime = performance.now();
      const responseData = await response.json();
      
      const result = {
        test: test.name,
        status: response.ok ? '✅ Success' : '❌ Failed',
        responseTime: `${(endTime - startTime).toFixed(2)}ms`,
        dbTime: responseData._debug?.dbTime || responseData.database?.responseTime || 'N/A',
        status_code: response.status
      };
      
      results.push(result);
      console.log(`${result.test}: ${result.responseTime} (DB: ${result.dbTime})`);
      
    } catch (error) {
      const failedResult = {
        test: test.name,
        status: '❌ Error',
        responseTime: 'Failed',
        dbTime: 'N/A',
        error: error.message
      };
      results.push(failedResult);
      console.error(`${test.name} failed:`, error);
    }
  }
  
  console.log('\n📊 Performance Summary:');
  console.table(results);
  
  // Calculate average response time
  const successfulTests = results.filter(r => r.status === '✅ Success');
  if (successfulTests.length > 0) {
    const avgTime = successfulTests.reduce((sum, r) => {
      return sum + parseFloat(r.responseTime);
    }, 0) / successfulTests.length;
    
    console.log(`\n⚡ Average Response Time: ${avgTime.toFixed(2)}ms`);
    
    if (avgTime < 1000) {
      console.log('🎉 Great! Sub-second response times achieved.');
    } else if (avgTime < 3000) {
      console.log('👍 Good response times, under 3 seconds.');
    } else {
      console.log('⚠️  Response times are still high. Consider further optimizations.');
    }
  }
  
  return results;
}

// Auto-run the test
testAPIPerformance();
