import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define protected paths
  const isAdminPath = path.startsWith('/admin');
  
  // Check if user is authenticated (based on session cookie)
  const session = request.cookies.get('session')?.value;
  const isAuthenticated = !!session;
  
  // Check for admin authorization
  const isAdmin = request.cookies.get('role')?.value === 'admin';
  
  // Handle admin routes
  if (isAdminPath && (!isAuthenticated || !isAdmin)) {
    return NextResponse.redirect(new URL('/login?error=unauthorized&redirect=' + encodeURIComponent(path), request.url));
  }
  
  return NextResponse.next();
}

// Configure paths that the middleware applies to
export const config = {
  matcher: ['/admin/:path*'],
}; 