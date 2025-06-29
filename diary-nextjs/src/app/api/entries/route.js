import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
import { verifyToken } from '../../../utils/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    console.log('Starting entries GET request...');
    
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;
    
    console.log('Request params:', { page, limit, offset });
    
    // Test database connection first
    console.log('Testing database connection...');
    await pool.execute('SELECT 1');
    console.log('Database connection successful');
    
    // Get user authentication
    console.log('Checking authentication...');
    const user = verifyToken(request);
    console.log('User auth result:', user);
    
    let query;
    let params;
    
    if (user && user.userId) {
      console.log('Using authenticated user query for userId:', user.userId);
      // Use parameterized query for user_id but string interpolation for LIMIT/OFFSET
      query = `SELECT id, date, content as text, is_shared FROM entries WHERE user_id = ? ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`;
      params = [user.userId];
    } else {
      // For backward compatibility, get all entries if no user
      console.log('Using public query (no authentication)');
      query = `SELECT id, date, content as text, is_shared FROM entries ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`;
      params = [];
    }
    
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    const [rows] = await pool.execute(query, params);
    console.log('Query successful, got', rows.length, 'rows');
    
    // Add caching headers for better performance
    const response = NextResponse.json({
      entries: rows,
      pagination: {
        page,
        limit,
        hasMore: rows.length === limit
      }
    });
    
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=30');
    
    return response;
  } catch (error) {
    console.error('GET /api/entries error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to read entries.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
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
    
    const [result] = await pool.execute(
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
    const { id, text, is_shared } = body;
    
    console.log('PUT request body:', { id, text, is_shared, userId: user.userId });
    
    // Build update query based on provided fields
    if (text !== undefined) {
      // Update entry text
      await pool.execute(
        'UPDATE entries SET content = ? WHERE id = ? AND user_id = ?', 
        [text, id, user.userId]
      );
    }
    
    if (is_shared !== undefined) {
      try {
        // Update sharing status
        await pool.execute(
          'UPDATE entries SET is_shared = ? WHERE id = ? AND user_id = ?',
          [is_shared, id, user.userId]
        );
        console.log('Successfully updated is_shared for entry:', id);
      } catch (columnError) {
        console.log('is_shared column might not exist, adding it...', columnError.message);
        // Try to add the column if it doesn't exist
        try {
          await pool.execute('ALTER TABLE entries ADD COLUMN is_shared BOOLEAN DEFAULT FALSE');
          console.log('Added is_shared column, retrying update...');
          // Retry the update
          await pool.execute(
            'UPDATE entries SET is_shared = ? WHERE id = ? AND user_id = ?',
            [is_shared, id, user.userId]
          );
          console.log('Successfully updated is_shared after adding column');
        } catch (alterError) {
          console.error('Failed to add is_shared column:', alterError);
          return NextResponse.json({ error: 'Database schema error: ' + alterError.message }, { status: 500 });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to update entry: ' + error.message }, { status: 500 });
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
    await pool.execute('DELETE FROM entries WHERE id = ? AND user_id = ?', [id, user.userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }
}
