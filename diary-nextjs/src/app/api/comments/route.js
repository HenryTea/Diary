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
  try {
    const { entryId, comment } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    if (!comment.trim()) {
      return Response.json({ error: 'Comment cannot be empty' }, { status: 400 });
    }
    
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    const [result] = await connection.execute(
      'INSERT INTO comments (user_id, entry_id, comment_text) VALUES (?, ?, ?)',
      [userId, entryId, comment.trim()]
    );
    
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
    
    await connection.end();
    
    return Response.json({ success: true, comment: newComment[0] });
  } catch (error) {
    console.error('Comment creation error:', error);
    return Response.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
