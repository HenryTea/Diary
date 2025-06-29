import jwt from 'jsonwebtoken';
import pool from '../../../utils/db';

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
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50')));
    
    if (!entryId) {
      return Response.json({ error: 'Entry ID required' }, { status: 400 });
    }
    
    const [comments] = await pool.execute(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.entry_id = ?
      ORDER BY c.created_at ASC
      LIMIT ${limit}
    `, [parseInt(entryId)]);
    
    return Response.json(comments);
  } catch (error) {
    console.error('Comments fetch error:', error);
    return Response.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request) {
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

    // Insert comment using connection pool
    console.log('Inserting comment...');
    const [result] = await pool.execute(
      'INSERT INTO comments (user_id, entry_id, comment_text) VALUES (?, ?, ?)',
      [parseInt(userId), parseInt(entryId), comment.trim()]
    );
    
    console.log('Comment inserted with ID:', result.insertId);

    // Get the created comment with user info
    console.log('Fetching created comment...');
    const [newComment] = await pool.execute(`
      SELECT 
        c.id,
        c.comment_text,
        c.created_at,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    console.log('Comment creation successful');
    return Response.json(newComment[0]);
    
  } catch (error) {
    console.error('=== Comment POST Error ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: 'Failed to create comment', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
