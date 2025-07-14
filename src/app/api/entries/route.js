import { NextResponse } from 'next/server';
import jsonDb from '../../../utils/jsonDb.js';
import { verifyToken } from '../../../utils/auth';

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
    
    // Get user authentication with error handling
    console.log('Checking authentication...');
    let user = null;
    try {
      user = verifyToken(request);
      console.log('User auth result:', user);
    } catch (authError) {
      console.error('Auth verification error:', authError);
      user = null;
    }
    
    // Enforce authentication - return 401 if not authenticated
    if (!user || !user.userId) {
      console.log('Authentication required but not provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    let entries;
    
    console.log('Using authenticated user query for userId:', user.userId);
    
    if (specificId) {
      // Fetch specific entry
      const entry = await jsonDb.findEntryById(specificId);
      entries = entry && entry.user_id === user.userId ? [entry] : [];
    } else {
      // Get all user entries, then paginate
      const allEntries = await jsonDb.findEntriesByUserId(user.userId);
      allEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      entries = allEntries.slice(offset, offset + limit);
    }
    
    const dbTime = Date.now() - startTime;
    console.log(`Query successful, got ${entries.length} entries in ${dbTime}ms`);
    
    // Transform entries to match expected format
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      date: entry.created_at,
      text: entry.content,
      is_shared: entry.is_public || entry.is_shared
    }));
    
    // Optimized response with aggressive caching
    const response = NextResponse.json({
      entries: transformedEntries,
      pagination: specificId ? null : {
        page,
        limit,
        hasMore: entries.length === limit
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
    
    const entryData = {
      user_id: user.userId,
      content: text,
      is_public: false
    };
    
    const entry = await jsonDb.createEntry(entryData);
    
    return NextResponse.json({ 
      success: true, 
      entry: { 
        id: entry.id, 
        date: entry.created_at, 
        text: entry.content 
      } 
    });
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
    
    // First verify the entry belongs to the user
    const existingEntry = await jsonDb.findEntryById(id);
    if (!existingEntry || existingEntry.user_id !== user.userId) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }
    
    // Build update data
    const updateData = {};
    if (text !== undefined) {
      updateData.content = text;
    }
    if (is_shared !== undefined) {
      updateData.is_public = is_shared;
      updateData.is_shared = is_shared; // Keep both for compatibility
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }
    
    await jsonDb.updateEntry(id, updateData);
    
    const totalTime = Date.now() - startTime;
    console.log(`PUT completed successfully in ${totalTime}ms`);
    
    return NextResponse.json({ 
      success: true, 
      _debug: { totalTime: `${totalTime}ms` }
    });
    
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
    
    // First verify the entry belongs to the user
    const existingEntry = await jsonDb.findEntryById(id);
    if (!existingEntry || existingEntry.user_id !== user.userId) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }
    
    // Delete the entry
    const success = await jsonDb.deleteEntry(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }
}
