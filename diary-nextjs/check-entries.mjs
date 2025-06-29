import mysql from 'mysql2/promise';

async function checkEntries() {
  try {
    // Create connection to the diary database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'H.tl2537983098',
      database: 'diary'
    });
    
    console.log('Connected to MySQL diary database');
    
    // Get all entries with user information
    const [entries] = await connection.execute(`
      SELECT 
        e.id, 
        e.content, 
        e.date, 
        e.user_id,
        u.username,
        u.email
      FROM entries e 
      JOIN users u ON e.user_id = u.id 
      ORDER BY e.date DESC
    `);
    
    console.log('\n📝 All Entries in Database:');
    console.log('===========================');
    
    if (entries.length === 0) {
      console.log('No entries found in the database.');
    } else {
      entries.forEach((entry, index) => {
        console.log(`${index + 1}. Entry ID: ${entry.id}`);
        console.log(`   User: ${entry.username} (ID: ${entry.user_id})`);
        console.log(`   Date: ${entry.date}`);
        console.log(`   Content: ${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}`);
        console.log('   ---');
      });
    }
    
    console.log(`\nTotal entries: ${entries.length}`);
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEntries();
