import mysql from 'mysql2/promise';

async function checkUsers() {
  try {
    // Create connection to the diary database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'H.tl2537983098',
      database: 'diary'
    });
    
    console.log('Connected to MySQL diary database');
    
    // Get all users
    const [users] = await connection.execute('SELECT * FROM users');
    
    console.log('\n📋 All Users in Database:');
    console.log('========================');
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.created_at}`);
        console.log(`   Updated: ${user.updated_at}`);
        console.log('   ---');
      });
    }
    
    console.log(`\nTotal users: ${users.length}`);
    
    await connection.end();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
