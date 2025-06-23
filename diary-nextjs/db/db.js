import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost', // MySQL server address (do not include port here)
  port: 3306,        // MySQL port (default is 3306)
  user: 'root',      // your MySQL username
  password: 'H.tl2537983098', // your MySQL password
  database: 'diary', // your database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;