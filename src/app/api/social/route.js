import jsonDb from '../../../utils/jsonDb.js';
import { verifyToken } from '../../../utils/auth';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;
    
    // Get all public/shared entries
    const publicEntries = await jsonDb.getPublicEntries();
    
    // Sort by creation date (newest first)
    publicEntries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Paginate
    const paginatedEntries = publicEntries.slice(offset, offset + limit);
    
    // Enhance each entry with user info, likes count, and comments count
    const enhancedEntries = await Promise.all(
      paginatedEntries.map(async (entry) => {
        const user = await jsonDb.findUserById(entry.user_id);
        const likesCount = await jsonDb.countLikes(entry.id);
        const comments = await jsonDb.findCommentsByEntryId(entry.id);
        
        return {
          id: entry.id,
          text: entry.content,
          date: entry.created_at,
          is_rich_text: entry.is_rich_text || false,
          created_at: entry.created_at,
          user_id: entry.user_id,
          username: user?.username || 'Unknown',
          likes_count: likesCount,
          comments_count: comments.length
        };
      })
    );
    
    const response = Response.json({
      entries: enhancedEntries,
      pagination: {
        page,
        limit,
        hasMore: paginatedEntries.length === limit
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
    
    // Get user from cookie authentication
    const user = verifyToken(request);
    if (!user) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }
    
    const userId = user.userId;
    
    if (!userId) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }
    
    if (action === 'toggle_like') {
      // Check if user already liked this entry
      const existingLike = await jsonDb.findLike(userId, entryId);
      
      if (existingLike) {
        // Unlike
        await jsonDb.deleteLike(userId, entryId);
      } else {
        // Like
        await jsonDb.createLike(userId, entryId);
      }
      
      // Get updated like count
      const likesCount = await jsonDb.countLikes(entryId);
      
      return Response.json({ 
        success: true, 
        liked: !existingLike,
        likes_count: likesCount
      });
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Social action error:', error);
    return Response.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
