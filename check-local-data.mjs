// check-local-data.mjs
import mysql from 'mysql2/promise';

async function checkData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'H.tl2537983098',
      database: 'diary'
    });

    console.log('=== USERS ===');
    const [users] = await connection.execute('SELECT * FROM users');
    console.table(users);

    console.log('\n=== ENTRIES ===');
    const [entries] = await connection.execute('SELECT * FROM entries');
    console.table(entries);

    console.log('\n=== SUMMARY ===');
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Entries: ${entries.length}`);

    await connection.end();
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData();
