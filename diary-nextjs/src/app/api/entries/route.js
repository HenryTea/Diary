import { NextResponse } from 'next/server';
import pool from '@/utils/db';
import { verifyToken } from '@/utils/auth';

export const runtime = 'nodejs';

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    console.log('Starting entries GET request...');
    
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;
    const specificId = url.searchParams.get('id');
    
    console.log('Request params:', { page, limit, offset, specificId });
    
    // Get user authentication (no DB call needed here)
    console.log('Checking authentication...');
    const user = verifyToken(request);
    console.log('User auth result:', user);
    
    let query;
    let params;
    
    if (user && user.userId) {
      console.log('Using authenticated user query for userId:', user.userId);
      
      if (specificId) {
        // Optimized: Use index on user_id and id
        query = `SELECT id, date, content as text, is_shared FROM entries WHERE user_id = ? AND id = ? LIMIT 1`;
        params = [user.userId, specificId];
      } else {
        // Optimized: Use prepared statement with static limit/offset
        query = `SELECT id, date, content as text, is_shared FROM entries WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?`;
        params = [user.userId, limit, offset];
      }
    } else {
      console.log('Using public query (no authentication)');
      
      if (specificId) {
        query = `SELECT id, date, content as text, is_shared FROM entries WHERE id = ? LIMIT 1`;
        params = [specificId];
      } else {
        query = `SELECT id, date, content as text, is_shared FROM entries ORDER BY date DESC LIMIT ? OFFSET ?`;
        params = [limit, offset];
      }
    }
    
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    // Single optimized database call
    const [rows] = await pool.execute(query, params);
    
    const dbTime = Date.now() - startTime;
    console.log(`Query successful, got ${rows.length} rows in ${dbTime}ms`);
    
    // Optimized response with aggressive caching
    const response = NextResponse.json({
      entries: rows,
      pagination: specificId ? null : {
        page,
        limit,
        hasMore: rows.length === limit
      },
      _debug: {
        dbTime: `${dbTime}ms`,
        totalTime: `${Date.now() - startTime}ms`
      }
    });
    
    // Aggressive caching for Railway-Vercel optimization
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=60');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60');
    
    return response;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`GET /api/entries error after ${totalTime}ms:`, error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to read entries.',
      details: error.message,
      _debug: { totalTime: `${totalTime}ms` },
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
  const startTime = Date.now();
  
  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { id, text, is_shared } = body;
    
    console.log('PUT request body:', { id, text: text?.length, is_shared, userId: user.userId });
    
    // Optimize: Use a single transaction for multiple updates
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Build and execute updates efficiently
      if (text !== undefined && is_shared !== undefined) {
        // Single query for both updates
        await connection.execute(
          'UPDATE entries SET content = ?, is_shared = ? WHERE id = ? AND user_id = ?', 
          [text, is_shared, id, user.userId]
        );
      } else if (text !== undefined) {
        // Update entry text only
        await connection.execute(
          'UPDATE entries SET content = ? WHERE id = ? AND user_id = ?', 
          [text, id, user.userId]
        );
      } else if (is_shared !== undefined) {
        // Update sharing status only
        try {
          await connection.execute(
            'UPDATE entries SET is_shared = ? WHERE id = ? AND user_id = ?',
            [is_shared, id, user.userId]
          );
        } catch (columnError) {
          if (columnError.code === 'ER_BAD_FIELD_ERROR') {
            console.log('is_shared column missing, adding it...');
            await connection.execute('ALTER TABLE entries ADD COLUMN is_shared BOOLEAN DEFAULT FALSE');
            await connection.execute(
              'UPDATE entries SET is_shared = ? WHERE id = ? AND user_id = ?',
              [is_shared, id, user.userId]
            );
          } else {
            throw columnError;
          }
        }
      }
      
      await connection.commit();
      
      const totalTime = Date.now() - startTime;
      console.log(`PUT completed successfully in ${totalTime}ms`);
      
      return NextResponse.json({ 
        success: true, 
        _debug: { totalTime: `${totalTime}ms` }
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`PUT /api/entries error after ${totalTime}ms:`, error);
    return NextResponse.json({ 
      error: 'Failed to update entry: ' + error.message,
      _debug: { totalTime: `${totalTime}ms` }
    }, { status: 500 });
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
