import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  ...mysql.createConnection({uri: process.env.DATABASE_URL}),
  ssl: {
    rejectUnauthorized: true
  }
});

export default pool;