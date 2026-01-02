/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { PrismaClient, UserRole } from '@prisma/client';
import { auth } from '../src/auth';

const prisma = new PrismaClient();

async function main() {
  // Create admin user if it doesn't exist
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: {
      accounts: {
        where: { providerId: 'credential' },
      },
    },
  });

  if (!existingAdmin) {
    // Use BetterAuth's signUpEmail API to create user with proper password hashing
    // Create a minimal headers object for the seed script
    const headers = new Headers();
    
    try {
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin User',
        },
        headers: headers,
      });

      if (!signUpResult.user) {
        throw new Error('Failed to create admin user via BetterAuth');
      }

      // Update user with ADMIN role (BetterAuth doesn't handle custom fields)
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: UserRole.ADMIN,
        },
      });

      console.log('✅ Admin user created:', adminEmail);
      console.log('   Password:', adminPassword);
    } catch (error: any) {
      console.error('❌ Failed to create admin user:', error?.message || error);
      throw error;
    }
  } else {
    // Check if user has a credential account (password)
    const hasCredentialAccount = existingAdmin.accounts.some(
      (acc) => acc.providerId === 'credential'
    );

    if (!hasCredentialAccount) {
      console.log('⚠️  Admin user exists but has no password. Updating role...');
      // Update role if not already admin
      if (existingAdmin.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: UserRole.ADMIN },
        });
        console.log('✅ Admin role updated');
      }
    } else {
      // Update role if not already admin
      if (existingAdmin.role !== UserRole.ADMIN) {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { role: UserRole.ADMIN },
        });
        console.log('✅ Admin role updated');
      }
    }
    console.log('ℹ️  Admin user already exists:', adminEmail);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

