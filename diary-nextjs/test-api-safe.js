#!/usr/bin/env node

/**
 * Simple API Test Script
 * Tests basic API functionality
 */

import { fetch } from 'undici';

const API_BASE = 'http://localhost:3000';

async function testAPIEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE}/api/health`,
      method: 'GET'
    },
    {
      name: 'Entries (Unauthorized)',
      url: `${API_BASE}/api/entries`,
      method: 'GET'
    },
    {
      name: 'Auth Check',
      url: `${API_BASE}/api/auth-check`,
      method: 'GET'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const response = await fetch(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Diary-Test-Client/1.0'
        }
      });
      
      const status = response.status;
      const statusText = response.statusText;
      
      console.log(`  Status: ${status} ${statusText}`);
      
      try {
        const data = await response.text();
        const truncated = data.length > 200 ? data.substring(0, 200) + '...' : data;
        console.log(`  Response: ${truncated}`);
      } catch {
        console.log('  Response: [Binary or invalid data]');
      }
      
      // Status check
      if (status < 500) {
        console.log('  ✅ PASS\n');
      } else {
        console.log('  ❌ FAIL (Server Error)\n');
      }
      
    } catch (error) {
      console.log(`  ❌ FAIL: ${error.message}\n`);
    }
  }
}

async function testServerConnection() {
  console.log('🌐 Testing Server Connection...\n');
  
  try {
    const response = await fetch(`${API_BASE}`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    console.log(`Server Status: ${response.status}`);
    console.log('✅ Server is reachable\n');
    return true;
  } catch (error) {
    console.log(`❌ Server unreachable: ${error.message}`);
    console.log('Make sure the server is running on localhost:3000\n');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const serverReachable = await testServerConnection();
  
  if (serverReachable) {
    await testAPIEndpoints();
  }
  
  console.log('🏁 API Tests Complete!');
}

// Install undici if not available
async function ensureDependencies() {
  try {
    await import('undici');
  } catch {
    console.log('Installing undici for fetch support...');
    const { execSync } = await import('child_process');
    execSync('npm install undici', { stdio: 'inherit' });
    console.log('Undici installed successfully!');
  }
}

// Main execution
async function main() {
  try {
    await ensureDependencies();
    await runTests();
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}

main();
