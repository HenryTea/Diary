import jwt from 'jsonwebtoken';

export function verifyToken(request) {
  try {
    // Try JWT token first (Authorization header)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        return decoded;
      } catch {
        console.log('JWT verification failed, trying cookie auth');
      }
    }
    
    // Fallback to cookie-based authentication
    const cookies = request.headers.get('cookie') || '';
    const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
    
    if (!authCookie) {
      return null;
    }
    
    try {
      const cookieValue = authCookie.split('=')[1];
      const decoded = JSON.parse(decodeURIComponent(cookieValue));
      
      // Check if cookie is expired
      if (decoded.expires && new Date() > new Date(decoded.expires)) {
        return null;
      }
      
      // Return user data in the same format as JWT
      const user = decoded.user;
      if (user) {
        return {
          userId: user.id || user.userId,
          username: user.username,
          email: user.email
        };
      }
    } catch (cookieError) {
      console.log('Cookie decode error:', cookieError);
    }
    
    return null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function getUserFromStorage() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function getTokenFromStorage() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token;
  }
  return null;
}
