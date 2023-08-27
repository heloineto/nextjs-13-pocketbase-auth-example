import { NextRequest, NextResponse } from 'next/server';
import { isTokenExpired } from 'pocketbase';

export function middleware(request: NextRequest) {
  // You can also export a `config.matcher` array,
  // but i believe this way is more straightforward and scalable.
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const authCookie = request.cookies.get('pb_auth');
    const token = authCookie?.value ? JSON.parse(authCookie.value).token : null;

    // If there's no token or it's expired, redirect to login page.
    if (!token || isTokenExpired(token)) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }
}

// Read more about Next.js middleware in: https://nextjs.org/docs/app/building-your-application/routing/middleware
