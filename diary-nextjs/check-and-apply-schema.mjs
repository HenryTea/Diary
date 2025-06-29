import mysql from 'mysql2/promise';

async function checkAndApplySchema() {
  try {
    // Use the Railway database URL directly
    const DATABASE_URL = 'mysql://root:bCezukLBvzeVDhFHUsbJkraTBNcmnCSi@maglev.proxy.rlwy.net:55569/railway';
    const connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('Connected to Railway database');
    
    // Check if is_shared column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'entries' 
      AND COLUMN_NAME = 'is_shared'
    `);
    
    if (columns.length === 0) {
      console.log('is_shared column not found. Adding it...');
      await connection.execute('ALTER TABLE entries ADD COLUMN is_shared BOOLEAN DEFAULT FALSE');
      console.log('✅ Added is_shared column to entries table');
    } else {
      console.log('✅ is_shared column already exists');
    }
    
    // Check if likes table exists
    const [likesTable] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'likes'
    `);
    
    if (likesTable.length === 0) {
      console.log('likes table not found. Creating it...');
      await connection.execute(`
        CREATE TABLE likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          entry_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
          UNIQUE KEY unique_like (user_id, entry_id)
        )
      `);
      console.log('✅ Created likes table');
    } else {
      console.log('✅ likes table already exists');
    }
    
    // Check if comments table exists
    const [commentsTable] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'comments'
    `);
    
    if (commentsTable.length === 0) {
      console.log('comments table not found. Creating it...');
      await connection.execute(`
        CREATE TABLE comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          entry_id INT NOT NULL,
          comment_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Created comments table');
    } else {
      console.log('✅ comments table already exists');
    }
    
    console.log('\n🎉 Schema check and migration completed successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error checking/applying schema:', error);
    process.exit(1);
  }
}

checkAndApplySchema();
