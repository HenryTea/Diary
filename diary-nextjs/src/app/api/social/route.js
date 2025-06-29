import jwt from 'jsonwebtoken';
import pool from '@/utils/db';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    
    // Get all shared entries with user info, likes count, and comments count
    // Using LEFT JOINs instead of subqueries for better performance
    // Use string interpolation for LIMIT/OFFSET to avoid MySQL parameter binding issues
    const [entries] = await pool.execute(`
      SELECT 
        e.id,
        e.content as text,
        e.date,
        e.is_rich_text,
        e.created_at,
        u.id as user_id,
        u.username,
        COALESCE(like_counts.likes_count, 0) as likes_count,
        COALESCE(comment_counts.comments_count, 0) as comments_count
      FROM entries e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN (
        SELECT entry_id, COUNT(*) as likes_count 
        FROM likes 
        GROUP BY entry_id
      ) like_counts ON e.id = like_counts.entry_id
      LEFT JOIN (
        SELECT entry_id, COUNT(*) as comments_count 
        FROM comments 
        GROUP BY entry_id
      ) comment_counts ON e.id = comment_counts.entry_id
      WHERE e.is_shared = TRUE
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    const response = Response.json({
      entries,
      pagination: {
        page,
        limit,
        hasMore: entries.length === limit
      }
    });
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=60');
    
    return response;
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
    
    if (action === 'toggle_like') {
      // Check if user already liked this entry
      const [existing] = await pool.execute(
        'SELECT id FROM likes WHERE user_id = ? AND entry_id = ?',
        [userId, entryId]
      );
      
      if (existing.length > 0) {
        // Unlike
        await pool.execute(
          'DELETE FROM likes WHERE user_id = ? AND entry_id = ?',
          [userId, entryId]
        );
      } else {
        // Like
        await pool.execute(
          'INSERT INTO likes (user_id, entry_id) VALUES (?, ?)',
          [userId, entryId]
        );
      }
      
      // Get updated like count
      const [likeCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM likes WHERE entry_id = ?',
        [entryId]
      );
      
      return Response.json({ 
        success: true, 
        liked: existing.length === 0,
        likes_count: likeCount[0].count
      });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Social action error:', error);
    return Response.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
