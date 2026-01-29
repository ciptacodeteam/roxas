import { NextRequest, NextResponse } from 'next/server';
import { routing } from './src/i18n/routing';
import createMiddleware from 'next-intl/middleware';

// Create next-intl middleware with locale prefix strategy
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip locale handling for admin routes - they don't need localization
  if (pathname.startsWith('/admin')) {
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

  // Run next-intl middleware for all public routes
  // It will automatically redirect "/" to "/id" (default locale)
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'], // Match semua path kecuali API, file Next.js, dll
};