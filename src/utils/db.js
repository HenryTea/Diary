// JSON Database Adapter
// This file serves as a compatibility layer for any remaining MySQL imports
// All database operations now use the JSON database in jsonDb.js

import jsonDb from './jsonDb.js';

// Compatibility function for health checks
export function getPoolHealth() {
  try {
    return {
      status: 'healthy',
      databaseType: 'JSON File Database',
      jsonDbConfigured: !!jsonDb,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Export jsonDb as default for any remaining imports
export default jsonDb;
