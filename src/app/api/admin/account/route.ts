import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/server/db';
import { getServerAuthSession } from '@/auth';
import { UserRole } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/password';

const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

async function getCurrentAdmin() {
  const session = await getServerAuthSession();
  if (!session || session.user.role !== UserRole.ADMIN) return null;
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });
  
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdmin();

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
          phone: user.phone,
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
    const user = await getCurrentAdmin();

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
        phone: data.phone,
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
          phone: updatedUser.phone,
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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAdmin();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = ChangePasswordSchema.parse(body);

    // Verify current password
    if (!user.password) {
      return NextResponse.json(
        { success: false, message: 'This account does not have a password set' },
        { status: 400 }
      );
    }

    const passwordMatch = await verifyPassword(data.currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.newPassword);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);

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


