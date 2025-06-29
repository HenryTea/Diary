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
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
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
