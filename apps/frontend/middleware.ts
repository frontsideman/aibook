import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect book creation routes
  if (pathname.startsWith('/books/new')) {
    // In a real app, we would fetch this from the backend or a cookie
    // For this task, we'll assume a mock check
    const hasProfiles = false; // Mock value

    if (!hasProfiles) {
      return NextResponse.redirect(new URL('/profiles', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/books/new/:path*'],
};
