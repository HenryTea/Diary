import { NextResponse } from 'next/server';
import pool from '../../../../db/db';
import { verifyToken } from '../../../utils/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    // For now, allow access without authentication but prepare for user-specific entries
    const user = verifyToken(request);
    let query, params;
    
    if (user) {
      // Get entries for authenticated user
      query = 'SELECT id, date, content as text FROM entries WHERE user_id = ? ORDER BY date DESC';
      params = [user.userId];
    } else {
      // For backward compatibility, get all entries if no user (temporary)
      query = 'SELECT id, date, content as text FROM entries ORDER BY date DESC';
      params = [];
    }
    
    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to read entries.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;
    
    // Convert to MySQL compatible datetime format
    const now = new Date();
    const date = now.toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:MM:SS
    
    const [result] = await pool.query(
      'INSERT INTO entries (user_id, date, content) VALUES (?, ?, ?)', 
      [user.userId, date, text]
    );
    
    const insertId = result.insertId || (result[0] && result[0].insertId);
    return NextResponse.json({ success: true, entry: { id: insertId, date: now.toISOString(), text } });
  } catch (err) {
    console.error('POST /api/entries error:', err);
    return NextResponse.json({ error: 'Failed to save entry.', details: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, text } = body;
    
    // Update only entries belonging to the user
    await pool.query(
      'UPDATE entries SET content = ? WHERE id = ? AND user_id = ?', 
      [text, id, user.userId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to update entry.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    
    // Delete only entries belonging to the user
    await pool.query('DELETE FROM entries WHERE id = ? AND user_id = ?', [id, user.userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }
}
