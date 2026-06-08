import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const defaultBackendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/books/new')) {
    try {
      const response = await fetch(`${defaultBackendUrl}/child-profiles`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (response.ok) {
        const profiles = await response.json();
        const hasProfiles = Array.isArray(profiles) && profiles.length > 0;

        if (!hasProfiles) {
          return NextResponse.redirect(new URL('/profiles', request.url));
        }
      }
    } catch {
      // If backend is unreachable, allow access (don't block)
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/books/new/:path*'],
};
