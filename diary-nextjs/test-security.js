/**
 * Security Test Script
 * Test various security implementations
 */

import { sanitizeHtml, sanitizeInput, RateLimiter, validateEntryId, validateHtmlContent } from './src/utils/security.js';

const testXSSPrevention = () => {
  console.log('🔒 Testing XSS Prevention...');
  
  const maliciousInput = '<script>alert("XSS")</script><img src=x onerror=alert("XSS2")>';
  
  const sanitizedHtml = sanitizeHtml(maliciousInput);
  const sanitizedInput = sanitizeInput(maliciousInput);
  
  console.log('Original:', maliciousInput);
  console.log('Sanitized HTML:', sanitizedHtml);
  console.log('Sanitized Input:', sanitizedInput);
  
  // Should not contain script tags or event handlers
  const hasScript = sanitizedHtml.includes('<script>') || sanitizedInput.includes('<script>');
  const hasOnerror = sanitizedHtml.includes('onerror') || sanitizedInput.includes('onerror');
  
  if (!hasScript && !hasOnerror) {
    console.log('✅ XSS Prevention: PASSED');
  } else {
    console.log('❌ XSS Prevention: FAILED');
  }
};

const testRateLimiting = () => {
  console.log('🔒 Testing Rate Limiting...');
  
  const limiter = new RateLimiter(3, 1000); // 3 attempts per second
  
  const userId = 'test-user';
  let allowedCount = 0;
  
  // Try 5 attempts
  for (let i = 0; i < 5; i++) {
    if (limiter.isAllowed(userId)) {
      allowedCount++;
    }
  }
  
  if (allowedCount === 3) {
    console.log('✅ Rate Limiting: PASSED');
  } else {
    console.log(`❌ Rate Limiting: FAILED (allowed ${allowedCount} instead of 3)`);
  }
};

const testInputValidation = () => {
  console.log('🔒 Testing Input Validation...');
  
  // Test valid IDs
  const validIds = ['new', 'abc123', 'test-entry_1'];
  const invalidIds = ['', '<script>', 'a'.repeat(100), '../../../etc/passwd'];
  
  let validIdTests = validIds.every(id => validateEntryId(id));
  let invalidIdTests = invalidIds.every(id => !validateEntryId(id));
  
  // Test HTML content
  const validHtml = '<p>Hello <strong>world</strong></p>';
  const invalidHtml = '<script>alert("xss")</script>';
  const tooLargeHtml = 'a'.repeat(3000000); // 3MB
  
  let validHtmlTest = validateHtmlContent(validHtml);
  let invalidHtmlTest = !validateHtmlContent(invalidHtml);
  let sizeHtmlTest = !validateHtmlContent(tooLargeHtml);
  
  if (validIdTests && invalidIdTests && validHtmlTest && invalidHtmlTest && sizeHtmlTest) {
    console.log('✅ Input Validation: PASSED');
  } else {
    console.log('❌ Input Validation: FAILED');
  }
};

const testSecureStorage = () => {
  console.log('🔒 Testing Secure Storage...');
  
  // This would need to run in browser environment
  console.log('ℹ️  Secure Storage: Manual testing required in browser');
};

// Run all tests
const runSecurityTests = () => {
  console.log('🛡️  Starting Security Tests...\n');
  
  try {
    testXSSPrevention();
    testRateLimiting();
    testInputValidation();
    testSecureStorage();
    
    console.log('\n🛡️  Security Tests Complete!');
  } catch (error) {
    console.error('❌ Security Test Error:', error);
  }
};

// Export functions for use in other modules
export {
  runSecurityTests,
  testXSSPrevention,
  testRateLimiting,
  testInputValidation,
  testSecureStorage
};

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests();
}
