import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // API auth routes are always accessible
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // If user is on a public path
  if (isPublicPath) {
    // If authenticated and trying to access login/register, redirect to home
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // For protected paths (including / and /api/sites)
  if (!token || !verifyToken(token)) {
    // Store the original URL to redirect after login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/api/sites/:path*',
  ],
};
