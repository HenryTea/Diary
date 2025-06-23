import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'maglev.proxy.rlwy.net',
  user: 'root',
  password: 'YOUR_PASSWORD',
  database: 'railway',
  port: 55569,
  ssl: {
    rejectUnauthorized: true
  }
});

export default pool;