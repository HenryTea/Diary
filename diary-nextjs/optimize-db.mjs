import mysql from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function addDatabaseIndexes() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected successfully');
    
    // Add indexes for better performance
    const indexes = [
      // Index for entries table
      "CREATE INDEX idx_entries_shared ON entries (is_shared, created_at DESC)",
      "CREATE INDEX idx_entries_user_id ON entries (user_id)",
      
      // Index for likes table
      "CREATE INDEX idx_likes_entry_id ON likes (entry_id)",
      "CREATE INDEX idx_likes_user_entry ON likes (user_id, entry_id)",
      
      // Index for comments table
      "CREATE INDEX idx_comments_entry_id ON comments (entry_id)",
      "CREATE INDEX idx_comments_user_id ON comments (user_id)",
      
      // Index for users table
      "CREATE INDEX idx_users_username ON users (username)"
    ];
    
    for (const indexQuery of indexes) {
      try {
        console.log('Creating index:', indexQuery.split(' ')[5]);
        await connection.execute(indexQuery);
        console.log('✅ Index created successfully');
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️  Index already exists');
        } else {
          console.log('❌ Error creating index:', error.message);
        }
      }
    }
    
    console.log('Database optimization completed successfully');
    return true;
    
  } catch (error) {
    console.error('Database optimization failed:', error);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the optimization
addDatabaseIndexes()
  .then((success) => {
    if (success) {
      console.log('✅ Database optimization completed');
      process.exit(0);
    } else {
      console.log('❌ Database optimization failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });
