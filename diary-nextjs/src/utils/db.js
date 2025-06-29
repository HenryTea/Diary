import mysql from 'mysql2/promise';

// Create a connection pool optimized for Railway + Vercel
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 20,          // Higher limit for concurrent requests
  queueLimit: 50,              // Allow more queued requests
  charset: 'utf8mb4',
  // Railway-Vercel optimizations
  idleTimeout: 900000,          // 15 minutes (keep connections alive longer)
  maxIdle: 12,                  // More idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 300,   // Faster keep-alive (300ms)
  // SSL and compression for Railway
  ssl: { rejectUnauthorized: false },
  compress: true,               // Enable compression for cross-cloud
  // Only use supported mysql2 options
  multipleStatements: false,
  dateStrings: false
});

// Connection health check with retry logic
let warmupAttempts = 0;
const maxWarmupAttempts = 3;

async function warmupPool() {
  try {
    warmupAttempts++;
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log(`Database pool warmed up successfully (attempt ${warmupAttempts})`);
    return true;
  } catch (error) {
    console.warn(`Database warmup attempt ${warmupAttempts} failed:`, error.message);
    if (warmupAttempts < maxWarmupAttempts) {
      setTimeout(() => warmupPool(), 2000); // Retry after 2 seconds
    }
    return false;
  }
}

// Start warmup process
warmupPool();

// Export a function to get pool health
export function getPoolHealth() {
  return {
    totalConnections: pool.pool._allConnections.length,
    freeConnections: pool.pool._freeConnections.length,
    queuedRequests: pool.pool._connectionQueue.length
  };
}

export default pool;
