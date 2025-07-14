import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  console.log(`Middleware invoked for: ${pathname}`);
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth-check',
    '/api/health',
    // Add static assets and other public paths
    '/_next',
    '/favicon.ico',
    '/icons8-refresh.svg',
    '/icons8-search.svg',
    '/sort-amount-up-svgrepo-com.svg',
    '/sort-amount-down-svgrepo-com.svg',
    '/logout.svg',
    '/home.svg',
    '/setting.svg',
    '/media.svg',
    '/next.svg',
    '/vercel.svg',
    '/globe.svg',
    '/file.svg',
    '/window.svg',
    '/header-icon.svg',
    '/favicon.svg'
  ];
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication cookie
  const cookies = request.headers.get('cookie') || '';
  const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth_session='));
  
  if (!authCookie) {
    console.log(`Middleware: No auth cookie found for ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const cookieValue = authCookie.split('=')[1];
    const decoded = JSON.parse(decodeURIComponent(cookieValue));
    
    // Check if cookie is expired
    if (decoded.expires && new Date() > new Date(decoded.expires)) {
      console.log(`Middleware: Auth cookie expired for ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user data exists
    if (!decoded.user || !decoded.user.id) {
      console.log(`Middleware: Invalid user data in cookie for ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    console.log(`Middleware: Valid auth cookie found for ${pathname}, allowing access`);
    return NextResponse.next();
    
  } catch (error) {
    console.log(`Middleware: Cookie decode error for ${pathname}:`, error.message);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
