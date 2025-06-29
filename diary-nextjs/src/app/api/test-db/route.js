import mysql from 'mysql2/promise';

export async function GET() {
  try {
    console.log('Testing database connection...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('Database connected, checking schema...');
    
    // Check if comments table exists and get its structure
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'comments'"
    );
    
    console.log('Comments table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      const [columns] = await connection.execute(
        "DESCRIBE comments"
      );
      console.log('Comments table structure:', columns);
    }
    
    // Check if users table exists
    const [userTables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );
    
    console.log('Users table exists:', userTables.length > 0);
    
    // Check for some test data
    const [testUsers] = await connection.execute(
      "SELECT id, username FROM users LIMIT 3"
    );
    
    console.log('Sample users:', testUsers);
    
    // Check for some test entries
    const [testEntries] = await connection.execute(
      "SELECT id, user_id, is_shared FROM entries WHERE is_shared = TRUE LIMIT 3"
    );
    
    console.log('Sample shared entries:', testEntries);
    
    await connection.end();
    
    return Response.json({
      success: true,
      schema: {
        commentsTableExists: tables.length > 0,
        usersTableExists: userTables.length > 0,
        commentsStructure: tables.length > 0 ? columns : null,
        sampleUsers: testUsers,
        sampleEntries: testEntries
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return Response.json({ 
      error: 'Database test failed', 
      details: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      }
    }, { status: 500 });
  }
}
