import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname from the request
  const { pathname } = request.nextUrl;
  
  // If user visits the root path, redirect to login
  if (pathname === '/') {
    // Always redirect to login first - let the client-side handle authentication
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (avoid redirect loops)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|favicon.svg).*)',
  ],
};
