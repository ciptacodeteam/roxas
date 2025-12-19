import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes with NextAuth
  if (pathname.startsWith('/admin')) {
    const session = await auth();

    // If accessing login page and already authenticated as admin, redirect to dashboard
    if (pathname === '/admin/login' && session?.user.role === UserRole.ADMIN) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    
    // Check authentication for admin routes (except login)
    if (pathname !== '/admin/login') {
      if (!session) {
        // Redirect to login if not authenticated
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }

      // Check if user is admin
      if (session.user.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    // Allow admin routes to pass through without next-intl
    return NextResponse.next();
  }

  // Handle protected user routes (require login)
  // Check if pathname contains /transaction or /profile (with locale prefix)
  const protectedRoutes = ['/transaction', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => {
    return /^\/(id|en|zh)\/transaction/.test(pathname) || 
           /^\/(id|en|zh)\/profile/.test(pathname) ||
           pathname === '/transaction' ||
           pathname === '/profile';
  });
  
  if (isProtectedRoute) {
    const session = await auth();
    
    if (!session) {
      // Extract locale from pathname if present
      const localeMatch = pathname.match(/^\/(id|en|zh)/);
      const locale = localeMatch ? localeMatch[1] : 'id';
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
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

