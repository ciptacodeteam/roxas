import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/server/db';
import { getServerAuthSession, auth } from '@/auth';
import { UserRole } from '@prisma/client';

const UpdateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().optional(),
});

const ChangePasswordSchema = z.object({
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
    include: {
      accounts: {
        where: { providerId: 'credential' },
      },
    },
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
          hasPassword: user.accounts.length > 0 && !!user.accounts[0]?.password,
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

    // Get proper password hash using Better Auth's hashing
    // Create a temp user to get the properly hashed password
    const tempEmail = 'temp_pw_' + Date.now() + '@temp.local';
    const headers = new Headers();
    
    let properHash: string;
    let tempUserId: string | undefined;

    try {
      const tempResult = await auth.api.signUpEmail({
        body: {
          email: tempEmail,
          password: data.newPassword,
          name: 'Temp',
        },
        headers,
      });

      if (!tempResult.user) {
        throw new Error('Failed to create temp user for password hashing');
      }

      tempUserId = tempResult.user.id;

      // Get the temp user's account password hash
      const tempUser = await db.user.findUnique({
        where: { id: tempResult.user.id },
        include: { accounts: { where: { providerId: 'credential' } } },
      });

      const tempAccount = tempUser?.accounts[0];
      if (!tempAccount?.password) {
        throw new Error('Failed to get password hash from temp user');
      }

      properHash = tempAccount.password;

      // Delete temp user immediately
      await db.user.delete({ where: { id: tempResult.user.id } });
      tempUserId = undefined;

    } catch (error) {
      // Clean up temp user if it exists
      if (tempUserId) {
        try {
          await db.user.delete({ where: { id: tempUserId } });
        } catch (e) {
          console.error('Failed to delete temp user:', e);
        }
      }
      throw error;
    }

    // Update admin's password with the proper hash
    await db.user.update({
      where: { id: user.id },
      data: { password: properHash },
    });

    // Update or create credential account
    const credentialAccount = user.accounts.find(acc => acc.providerId === 'credential');
    if (credentialAccount) {
      await db.account.update({
        where: { id: credentialAccount.id },
        data: { password: properHash },
      });
    } else {
      await db.account.create({
        data: {
          accountId: user.id,
          providerId: 'credential',
          userId: user.id,
          password: properHash,
        },
      });
    }

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


