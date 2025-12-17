import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/server/db';

const SESSION_COOKIE_NAME = 'admin-session';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    
    // Delete session from database if token exists
    if (sessionToken) {
      try {
        await db.session.deleteMany({
          where: { token: sessionToken },
        });
      } catch (dbError) {
        // Log error but continue with logout
        console.error('Error deleting session from database:', dbError);
      }
    }
    
    const response = NextResponse.json(
      { success: true, message: 'Logout successful' },
      { status: 200 }
    );
    
    // Delete the session cookie with proper options
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}

