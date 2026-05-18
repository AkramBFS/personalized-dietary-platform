import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Extract auth data from cookies
  const token = request.cookies.get('access_token')?.value;
  const role = request.cookies.get('user_role')?.value;

  // 2. Block unauthenticated access
  if (!token || !role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Admin routes
  if (pathname.startsWith('/admin')) {
    if (role !== 'high_admin') {
      const redirectPath =
        role === 'nutritionist' ? '/nutritionist' : '/client';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // 4. Nutritionist routes
  if (pathname.startsWith('/nutritionist')) {
    if (role === 'client') {
      return NextResponse.redirect(new URL('/client', request.url));
    }
  }

  // 5. Client & subscription routes
  if (
    pathname.startsWith('/client') ||
    pathname.startsWith('/subscription')
  ) {
    if (role === 'nutritionist') {
      return NextResponse.redirect(new URL('/nutritionist', request.url));
    }
  }

  // 6. Allow request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client/:path*',
    '/nutritionist/:path*',
    '/subscription/:path*',
  ],
};
