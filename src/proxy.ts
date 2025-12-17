import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing'; // Pastikan routing sudah dikonfigurasi

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude /admin routes from next-intl
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('admin-session');
    
    // If accessing login page and already authenticated, redirect to dashboard
    if (pathname === '/admin/login' && sessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    
    // Check authentication for admin routes (except login)
    if (pathname !== '/admin/login') {
      if (!sessionCookie) {
        // Redirect to login if not authenticated
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }
    }
    
    // Allow admin routes to pass through without next-intl
    return NextResponse.next();
  }

  // Cek apakah URL sudah mengandung locale (misalnya /en, /id, dst)
  const localePrefixPattern = /^\/(id|en|zh)(\/|$)/;

  // Jika URL tidak mengandung locale, redirect ke default locale
  if (!localePrefixPattern.test(pathname)) {
    // Cek apakah request ke root ("/") atau path lainnya tanpa locale
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = `/id`; // Redirect ke /id sebagai default
      return NextResponse.redirect(url, 308); // Permanent redirect
    }

    // Jika tidak di root, redirect ke locale default (misalnya /id/whatever)
    const url = request.nextUrl.clone();
    url.pathname = `/id${pathname}`; // Menambahkan locale "id" di depan path
    return NextResponse.redirect(url, 308); // Permanent redirect
  }

  // Lanjutkan dengan middleware i18n
  return intlMiddleware(request);
}

export const config = {
  // Match all paths except API routes, Next.js internals, and static files
  // Note: Admin routes are matched here so we can handle auth, but they're excluded from next-intl processing
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

