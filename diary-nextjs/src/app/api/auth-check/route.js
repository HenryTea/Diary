export async function GET(request) {
  try {
    // Check for authentication cookie
    const cookies = request.headers.get('cookie') || '';
    const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
    
    if (!authCookie) {
      return Response.json({
        isAuthenticated: false,
        requiresAuth: true,
        message: 'No authentication cookie found'
      });
    }
    
    const cookieValue = authCookie.split('=')[1];
    
    try {
      // Verify the cookie value (you can implement JWT verification here)
      const decoded = JSON.parse(decodeURIComponent(cookieValue));
      
      // Check if cookie is expired
      if (decoded.expires && new Date() > new Date(decoded.expires)) {
        return Response.json({
          isAuthenticated: false,
          requiresAuth: true,
          message: 'Authentication cookie expired'
        });
      }
      
      return Response.json({
        isAuthenticated: true,
        requiresAuth: false,
        user: decoded.user,
        message: 'Valid authentication cookie'
      });
      
    } catch (decodeError) {
      console.log('Cookie decode error:', decodeError);
      return Response.json({
        isAuthenticated: false,
        requiresAuth: true,
        message: 'Invalid authentication cookie'
      });
    }
    
  } catch (error) {
    console.error('Cookie check error:', error);
    return Response.json({ 
      error: 'Failed to check authentication', 
      requiresAuth: true 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action, user, token } = await request.json();
    
    if (action === 'set_auth_cookie') {
      // Create authentication cookie data
      const cookieData = {
        user,
        token,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        created: new Date().toISOString()
      };
      
      const cookieValue = encodeURIComponent(JSON.stringify(cookieData));
      
      // Set cookie with response headers
      const response = Response.json({ success: true, message: 'Authentication cookie set' });
      
      // Set cookie for 30 days
      response.headers.set('Set-Cookie', 
        `auth_session=${cookieValue}; Max-Age=${30 * 24 * 60 * 60}; Path=/; HttpOnly; SameSite=Strict`
      );
      
      return response;
    }
    
    if (action === 'clear_auth_cookie') {
      const response = Response.json({ success: true, message: 'Authentication cookie cleared' });
      
      // Clear cookie
      response.headers.set('Set-Cookie', 
        'auth_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict'
      );
      
      return response;
    }
    
    return Response.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Cookie action error:', error);
    return Response.json({ error: 'Failed to perform cookie action' }, { status: 500 });
  }
}
