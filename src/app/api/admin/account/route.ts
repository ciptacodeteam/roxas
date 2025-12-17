import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/server/db';

const SESSION_COOKIE_NAME = 'admin-session';

const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

async function getCurrentAdmin(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const session = await db.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.role !== 'ADMIN') return null;

  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdmin(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentAdmin(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = UpdateAccountSchema.parse(body);

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          image: updatedUser.image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update account error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


