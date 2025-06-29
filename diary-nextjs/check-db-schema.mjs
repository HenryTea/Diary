import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function checkAndCreateTables() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected successfully');
    
    // Check if comments table exists
    const [commentsTables] = await connection.execute(
      "SHOW TABLES LIKE 'comments'"
    );
    
    if (commentsTables.length === 0) {
      console.log('Comments table not found, creating...');
      await connection.execute(`
        CREATE TABLE comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          entry_id INT NOT NULL,
          comment_text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
        )
      `);
      console.log('Comments table created');
    } else {
      console.log('Comments table exists');
    }
    
    // Check if likes table exists
    const [likesTables] = await connection.execute(
      "SHOW TABLES LIKE 'likes'"
    );
    
    if (likesTables.length === 0) {
      console.log('Likes table not found, creating...');
      await connection.execute(`
        CREATE TABLE likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          entry_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_like (user_id, entry_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
        )
      `);
      console.log('Likes table created');
    } else {
      console.log('Likes table exists');
    }
    
    // Check if entries table has is_shared column
    const [columns] = await connection.execute(
      "DESCRIBE entries"
    );
    
    const hasIsShared = columns.some(col => col.Field === 'is_shared');
    
    if (!hasIsShared) {
      console.log('Adding is_shared column to entries table...');
      await connection.execute(
        'ALTER TABLE entries ADD COLUMN is_shared BOOLEAN DEFAULT FALSE'
      );
      console.log('is_shared column added');
    } else {
      console.log('entries table has is_shared column');
    }
    
    console.log('Database schema check completed successfully');
    return true;
    
  } catch (error) {
    console.error('Database schema check failed:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the check
checkAndCreateTables()
  .then((success) => {
    if (success) {
      console.log('✅ Database schema check passed');
      process.exit(0);
    } else {
      console.log('❌ Database schema check failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
