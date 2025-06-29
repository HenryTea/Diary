// Test script to simulate login redirect behavior
// Run this in browser console to test immediate redirect behavior

console.log('🧪 Testing immediate login redirect behavior...\n');

// Clear all auth data to simulate logged out state
localStorage.removeItem('token');
localStorage.removeItem('user');

// Clear any auth cookies
document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
document.cookie = 'user-data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

console.log('✅ Cleared all authentication data');
console.log('🔄 Now navigate to any protected route to test immediate redirect');
console.log('📱 Try these URLs:');
console.log('   - / (home page)');
console.log('   - /entries/1 (entry editor)');
console.log('   - /social (social feed)');
console.log('\n⚡ Expected behavior: Immediate redirect to /login without delay');

// Helper function to test a specific route
window.testRedirect = function(route) {
  console.log(`\n🧪 Testing route: ${route}`);
  const startTime = performance.now();
  
  // Navigate to route
  window.location.href = route;
  
  // Note: The actual redirect will happen, but this shows the intent
  setTimeout(() => {
    const endTime = performance.now();
    console.log(`⏱️  Redirect should have happened in <100ms (measured: ${(endTime - startTime).toFixed(2)}ms)`);
  }, 50);
};

console.log('\n🚀 Use testRedirect("/") to test the home page redirect');
