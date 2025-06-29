// check-railway-data.mjs
import mysql from 'mysql2/promise';

async function checkRailwayData() {
  try {
    const connection = await mysql.createConnection({
      host: 'maglev.proxy.rlwy.net',
      port: 55569,
      user: 'root',
      password: 'bCezukLBvzeVDhFHUsbJkraTBNcmnCSi',
      database: 'railway'
    });

    console.log('=== RAILWAY DATABASE CONNECTION SUCCESSFUL ===');

    console.log('\n=== USERS ===');
    const [users] = await connection.execute('SELECT * FROM users');
    console.table(users);

    console.log('\n=== ENTRIES ===');
    const [entries] = await connection.execute('SELECT * FROM entries');
    console.table(entries);

    console.log('\n=== SUMMARY ===');
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Entries: ${entries.length}`);

    await connection.end();
    console.log('\n✅ Data successfully migrated to Railway!');
  } catch (error) {
    console.error('Error checking Railway data:', error);
  }
}

checkRailwayData();
