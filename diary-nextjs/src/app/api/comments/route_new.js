import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

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
    const { entryId, comment } = await request.json();
    
    console.log('Comment POST request:', { entryId, hasComment: !!comment });
    
    if (!entryId) {
      return Response.json({ error: 'Entry ID required' }, { status: 400 });
    }
    
    if (!comment || !comment.trim()) {
      return Response.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }

    let userId;
    
    // Try JWT token first (Authorization header)
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('Token extracted:', { hasToken: !!token, tokenLength: token?.length });
        
        if (token && token !== 'null' && token !== 'undefined') {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
          console.log('JWT auth success:', { userId });
        }
      } catch (jwtError) {
        console.log('JWT verification failed:', jwtError.message);
      }
    }
    
    // Fallback to cookie-based authentication
    if (!userId) {
      console.log('Trying cookie auth...');
      const cookies = request.headers.get('cookie') || '';
      const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
      
      console.log('Cookie auth:', { hasCookies: !!cookies, hasAuthCookie: !!authCookie });
      
      if (authCookie) {
        try {
          const cookieValue = authCookie.split('=')[1];
          const decoded = JSON.parse(decodeURIComponent(cookieValue));
          
          // Check if cookie is expired
          if (decoded.expires && new Date() > new Date(decoded.expires)) {
            console.log('Cookie expired');
            return Response.json({ error: 'Session expired' }, { status: 401 });
          }
          
          userId = decoded.user?.id || decoded.user?.userId;
          console.log('Cookie auth success:', { userId });
        } catch (cookieError) {
          console.log('Cookie decode error:', cookieError.message);
        }
      }
    }
    
    if (!userId) {
      console.log('No valid authentication found');
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }

    console.log('Attempting database connection...');
    
    // Create database connection - use the full connection string
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('Database connection established');

    // Insert comment
    const [result] = await connection.execute(
      'INSERT INTO comments (user_id, entry_id, comment_text) VALUES (?, ?, ?)',
      [userId, parseInt(entryId), comment.trim()]
    );
    
    console.log('Comment inserted:', { insertId: result.insertId });

    // Get the created comment with user info
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
    
    console.log('Retrieved new comment:', newComment[0]);

    return Response.json({ success: true, comment: newComment[0] });
    
  } catch (error) {
    console.error('Comment creation error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
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
