import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Sign out using BetterAuth
    await auth.api.signOut({
      headers: request.headers,
    });

    return NextResponse.json(
      { success: true, message: 'Logout successful' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}

