import mysql from 'mysql2/promise';

async function runSchema() {
  try {
    // Create connection without specifying database first
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'H.tl2537983098',
      multipleStatements: true
    });
    
    console.log('Connected to MySQL');
    
    // Create database first
    await connection.execute('CREATE DATABASE IF NOT EXISTS diary');
    console.log('✓ Database created/verified');
    
    // Switch to the database using query instead of execute
    await connection.query('USE diary');
    console.log('✓ Using diary database');
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');
    
    // Check if entries table exists and back it up
    const [tables] = await connection.execute("SHOW TABLES LIKE 'entries'");
    if (tables.length > 0) {
      console.log('Found existing entries table, backing up...');
      await connection.execute('DROP TABLE IF EXISTS entries_backup');
      await connection.execute('CREATE TABLE entries_backup AS SELECT * FROM entries');
      console.log('✓ Entries backed up');
    }
    
    // Drop old entries table
    await connection.execute('DROP TABLE IF EXISTS entries');
    console.log('✓ Old entries table dropped');
    
    // Create new entries table with user relationship
    await connection.execute(`
      CREATE TABLE entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        content TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_rich_text BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ New entries table created');
    
    // Create indexes
    await connection.execute('CREATE INDEX idx_entries_user_id ON entries(user_id)');
    await connection.execute('CREATE INDEX idx_entries_date ON entries(date)');
    console.log('✓ Indexes created');
    
    // Insert default admin user
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password_hash) 
      VALUES ('admin', 'admin@diary.com', '$2b$10$ZqcEbjkEPuAm8WkkeVAe9.KbjMkWgfZwuvanJctoGbNVl4jV5DrPy')
    `);
    console.log('✓ Default admin user created (username: admin, password: admin123)');
    
    await connection.end();
    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runSchema();
