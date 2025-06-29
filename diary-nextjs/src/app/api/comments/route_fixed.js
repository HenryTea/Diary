import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

// Helper function to get user ID from request
async function getUserFromRequest(request) {
  // Try JWT token first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      if (token && token !== 'null' && token !== 'undefined') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
        return decoded.userId;
      }
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
    }
  }
  
  // Try cookie authentication
  try {
    const cookies = request.headers.get('cookie') || '';
    const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
    
    if (authCookie) {
      const cookieValue = authCookie.split('=')[1];
      const decoded = JSON.parse(decodeURIComponent(cookieValue));
      
      if (decoded.expires && new Date() > new Date(decoded.expires)) {
        return null; // Expired
      }
      
      return decoded.user?.id || decoded.user?.userId;
    }
  } catch (cookieError) {
    console.log('Cookie auth failed:', cookieError.message);
  }
  
  return null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const entryId = url.searchParams.get('entryId');
    
    if (!entryId) {
      return Response.json({ error: 'Entry ID required' }, { status: 400 });
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    const [comments] = await connection.execute(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.entry_id = ?
      ORDER BY c.created_at ASC
    `, [entryId]);
    
    await connection.end();
    
    return Response.json(comments);
  } catch (error) {
    console.error('Comments fetch error:', error);
    return Response.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request) {
  let connection;
  
  try {
    console.log('=== Comment POST Request Start ===');
    
    const body = await request.json();
    const { entryId, comment } = body;
    
    console.log('Request body:', { entryId, hasComment: !!comment });
    
    // Validate input
    if (!entryId) {
      console.log('Missing entryId');
      return Response.json({ error: 'Entry ID required' }, { status: 400 });
    }
    
    if (!comment || !comment.trim()) {
      console.log('Empty comment');
      return Response.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    // Get user ID
    const userId = await getUserFromRequest(request);
    console.log('User ID from auth:', userId);
    
    if (!userId) {
      console.log('No valid user authentication');
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Connect to database
    console.log('Connecting to database...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Database connected successfully');

    // Insert comment
    console.log('Inserting comment...');
    const [result] = await connection.execute(
      'INSERT INTO comments (user_id, entry_id, comment_text) VALUES (?, ?, ?)',
      [parseInt(userId), parseInt(entryId), comment.trim()]
    );
    
    console.log('Comment inserted with ID:', result.insertId);

    // Get the created comment with user info
    console.log('Fetching created comment...');
    const [newComment] = await connection.execute(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    console.log('Comment created successfully:', newComment[0]);
    console.log('=== Comment POST Request End ===');

    return Response.json({ 
      success: true, 
      comment: newComment[0] 
    });
    
  } catch (error) {
    console.error('=== Comment POST Error ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Full error:', error);
    console.error('=== End Comment POST Error ===');
    
    // Return different errors based on type
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return Response.json({ 
        error: 'Database table not found',
        details: 'Comments table may not exist'
      }, { status: 500 });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return Response.json({ 
        error: 'Database field error',
        details: 'Table structure may be incorrect'
      }, { status: 500 });
    }
    
    if (error.code?.startsWith('ER_')) {
      return Response.json({ 
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database operation failed'
      }, { status: 500 });
    }
    
    return Response.json({ 
      error: 'Failed to create comment',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }, { status: 500 });
    
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}
