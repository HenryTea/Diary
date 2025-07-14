export function verifyToken(request) {
  try {
    // Cookie-based authentication only
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
      
      // Return user data
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

// Cookie utility functions
export function createAuthCookie(user, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
  const expires = new Date(Date.now() + maxAge);
  const cookieData = {
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    },
    expires: expires.toISOString()
  };
  
  return {
    name: 'auth_session',
    value: encodeURIComponent(JSON.stringify(cookieData)),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(maxAge / 1000), // Convert to seconds
      path: '/'
    }
  };
}

export function clearAuthCookie() {
  return {
    name: 'auth_session',
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    }
  };
}

export function setResponseCookie(response, cookie) {
  const { name, value, options } = cookie;
  const cookieString = `${name}=${value}; Path=${options.path}; Max-Age=${options.maxAge}; SameSite=${options.sameSite}${options.httpOnly ? '; HttpOnly' : ''}${options.secure ? '; Secure' : ''}`;
  response.headers.set('Set-Cookie', cookieString);
  return response;
}
