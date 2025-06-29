import mysql from 'mysql2/promise';

// Create a connection pool for better performance
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // Railway-specific optimizations
  idleTimeout: 300000, // 5 minutes
  maxIdle: 5,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export default pool;
