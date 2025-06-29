import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Log the request details for debugging
    const debug = {
      body,
      headers: {
        authorization: request.headers.get('authorization'),
        cookie: request.headers.get('cookie'),
        'content-type': request.headers.get('content-type')
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Debug auth request:', debug);
    
    let authResult = { type: 'none', success: false };
    
    // Try JWT token first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        console.log('JWT token received:', token ? 'Yes' : 'No');
        
        if (token && token !== 'null' && token !== 'undefined') {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          authResult = {
            type: 'jwt',
            success: true,
            userId: decoded.userId,
            username: decoded.username
          };
          console.log('JWT decoded successfully:', decoded);
        } else {
          authResult = { type: 'jwt', success: false, error: 'Empty or invalid token' };
        }
      } catch (jwtError) {
        authResult = { type: 'jwt', success: false, error: jwtError.message };
        console.log('JWT verification failed:', jwtError.message);
      }
    }
    
    // Try cookie authentication if JWT failed
    if (!authResult.success) {
      const cookies = request.headers.get('cookie') || '';
      const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
      
      console.log('Cookie auth attempt:', { 
        hasCookies: !!cookies, 
        hasAuthCookie: !!authCookie 
      });
      
      if (authCookie) {
        try {
          const cookieValue = authCookie.split('=')[1];
          const decoded = JSON.parse(decodeURIComponent(cookieValue));
          
          console.log('Cookie decoded:', { 
            hasUser: !!decoded.user, 
            hasExpiry: !!decoded.expires,
            isExpired: decoded.expires ? new Date() > new Date(decoded.expires) : false
          });
          
          if (decoded.expires && new Date() > new Date(decoded.expires)) {
            authResult = { type: 'cookie', success: false, error: 'Session expired' };
          } else if (decoded.user) {
            authResult = {
              type: 'cookie',
              success: true,
              userId: decoded.user.id || decoded.user.userId,
              username: decoded.user.username
            };
          } else {
            authResult = { type: 'cookie', success: false, error: 'No user in cookie' };
          }
        } catch (cookieError) {
          authResult = { type: 'cookie', success: false, error: cookieError.message };
          console.log('Cookie decode error:', cookieError.message);
        }
      } else {
        authResult = { type: 'cookie', success: false, error: 'No auth cookie found' };
      }
    }
    
    return Response.json({
      debug,
      authResult,
      message: 'Debug complete'
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return Response.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 });
  }
}
