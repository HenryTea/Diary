import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // Get all shared entries with user info, likes count, and comments count
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    const [entries] = await connection.execute(`
      SELECT 
        e.id,
        e.content as text,
        e.date,
        e.is_rich_text,
        e.created_at,
        u.id as user_id,
        u.username,
        (SELECT COUNT(*) FROM likes l WHERE l.entry_id = e.id) as likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.entry_id = e.id) as comments_count
      FROM entries e
      JOIN users u ON e.user_id = u.id
      WHERE e.is_shared = TRUE
      ORDER BY e.created_at DESC
    `);
    
    await connection.end();
    
    return Response.json(entries);
  } catch (error) {
    console.error('Social entries fetch error:', error);
    return Response.json({ error: 'Failed to fetch social entries' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { entryId, action } = await request.json();
    let userId;
    
    // Try JWT token first (Authorization header)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch {
        console.log('JWT verification failed, trying cookie auth');
      }
    }
    
    // Fallback to cookie-based authentication
    if (!userId) {
      const cookies = request.headers.get('cookie') || '';
      const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
      
      if (!authCookie) {
        return Response.json({ error: 'Authorization required' }, { status: 401 });
      }
      
      try {
        const cookieValue = authCookie.split('=')[1];
        const decoded = JSON.parse(decodeURIComponent(cookieValue));
        
        // Check if cookie is expired
        if (decoded.expires && new Date() > new Date(decoded.expires)) {
          return Response.json({ error: 'Session expired' }, { status: 401 });
        }
        
        userId = decoded.user?.id || decoded.user?.userId;
        if (!userId) {
          return Response.json({ error: 'Invalid user session' }, { status: 401 });
        }
      } catch (cookieError) {
        console.log('Cookie decode error:', cookieError);
        return Response.json({ error: 'Invalid session' }, { status: 401 });
      }
    }
    
    if (!userId) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    if (action === 'toggle_like') {
      // Check if user already liked this entry
      const [existing] = await connection.execute(
        'SELECT id FROM likes WHERE user_id = ? AND entry_id = ?',
        [userId, entryId]
      );
      
      if (existing.length > 0) {
        // Unlike
        await connection.execute(
          'DELETE FROM likes WHERE user_id = ? AND entry_id = ?',
          [userId, entryId]
        );
      } else {
        // Like
        await connection.execute(
          'INSERT INTO likes (user_id, entry_id) VALUES (?, ?)',
          [userId, entryId]
        );
      }
      
      // Get updated like count
      const [likeCount] = await connection.execute(
        'SELECT COUNT(*) as count FROM likes WHERE entry_id = ?',
        [entryId]
      );
      
      await connection.end();
      
      return Response.json({ 
        success: true, 
        liked: existing.length === 0,
        likes_count: likeCount[0].count
      });
    }
    
    await connection.end();
    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Social action error:', error);
    return Response.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
