import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin-session';

export async function createAdminSession() {
  const cookieStore = await cookies();
  const sessionId = crypto.randomUUID();
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  return sessionId;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession();
  return !!session;
}

// Helper for API routes to set cookies via NextResponse
export function createAdminSessionCookie(sessionId: string) {
  return {
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
}

