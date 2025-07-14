import jsonDb from '../../../utils/jsonDb.js';
import { verifyToken } from '../../../utils/auth';

// Helper function to get user ID from request
async function getUserFromRequest(request) {
  const user = verifyToken(request);
  return user ? user.userId : null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const entryId = url.searchParams.get('entryId');
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') || '50')));
    
    if (!entryId) {
      return Response.json({ error: 'Entry ID required' }, { status: 400 });
    }
    
    // Get comments for the entry
    const comments = await jsonDb.findCommentsByEntryId(entryId);
    
    // Sort by creation date (oldest first for comments)
    comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Limit results
    const limitedComments = comments.slice(0, limit);
    
    // Enhance comments with user information
    const enhancedComments = await Promise.all(
      limitedComments.map(async (comment) => {
        const user = await jsonDb.findUserById(comment.user_id);
        return {
          id: comment.id,
          comment_text: comment.content || comment.comment_text,
          created_at: comment.created_at,
          username: user?.username || 'Unknown'
        };
      })
    );
    
    return Response.json(enhancedComments);
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

    // Create comment data
    const commentData = {
      user_id: userId,
      entry_id: entryId,
      content: comment.trim(),
      comment_text: comment.trim() // Keep both for compatibility
    };
    
    console.log('Creating comment...');
    const newComment = await jsonDb.createComment(commentData);
    
    console.log('Comment created with ID:', newComment.id);

    // Get user info for response
    const user = await jsonDb.findUserById(userId);
    
    const responseComment = {
      id: newComment.id,
      comment_text: newComment.content || newComment.comment_text,
      created_at: newComment.created_at,
      username: user?.username || 'Unknown'
    };
    
    console.log('Comment creation successful');
    return Response.json(responseComment);
    
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
