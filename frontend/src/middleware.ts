import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing'; // Pastikan routing sudah dikonfigurasi

// Create next-intl middleware with locale prefix strategy
const intlMiddleware = createMiddleware(routing);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Get user session from Django backend
 */
async function getSession(request: NextRequest) {
  try {
    // Get cookies from request
    const cookies = request.cookies.toString();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/token/me/`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip locale handling for admin routes - they don't need localization
  if (pathname.startsWith('/admin')) {
    // Check if user is trying to access admin routes
    const session = await getSession(request);
    
    // If accessing admin login, allow
    if (pathname === '/admin/login') {
      // If already logged in as admin, redirect to dashboard
      if (session?.role === 'STAFF') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }
    
    // For all other admin routes, require STAFF role
    if (!session || session.role !== 'STAFF') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
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