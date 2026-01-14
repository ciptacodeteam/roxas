/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { PrismaClient, UserRole, PaymentMethodType, BankTransferBank, FeeType, DiscountType } from '@prisma/client';
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

  // Seed Payment Methods based on Midtrans pricing
  // Reference: https://midtrans.com/pricing
  console.log('\n🌱 Seeding payment methods...');

  const paymentMethods = [
    // QRIS - 0.7% (VAT included in fee)
    {
      type: PaymentMethodType.QRIS as PaymentMethodType,
      bank: null,
      name: 'QRIS (Semua Pembayaran)',
      description: 'Bayar dengan QRIS melalui semua aplikasi pembayaran',
      icon: '/svg/QRIS_Logo.svg',
      feeType: FeeType.PERCENTAGE,
      feeValue: 0.7,
      vatType: FeeType.PERCENTAGE,
      vatValue: 0, // VAT included in fee
      isActive: true,
      midtransCode: 'qris',
    },
    // E-Wallet - GoPay - 2% (VAT included) or IDR 2,500 for gaming/digital
    // Using percentage for now, can be adjusted per product category
    {
      type: PaymentMethodType.E_WALLET as PaymentMethodType,
      bank: null,
      name: 'GoPay',
      description: 'Bayar dengan GoPay melalui aplikasi Gojek',
      icon: null,
      feeType: FeeType.PERCENTAGE,
      feeValue: 2.0,
      vatType: FeeType.PERCENTAGE,
      vatValue: 0, // VAT included in fee
      isActive: true,
      midtransCode: 'gopay',
    },
    // E-Wallet - ShopeePay - 2% (VAT included)
    {
      type: PaymentMethodType.E_WALLET as PaymentMethodType,
      bank: null,
      name: 'ShopeePay',
      description: 'Bayar dengan ShopeePay melalui aplikasi Shopee',
      icon: null,
      feeType: FeeType.PERCENTAGE,
      feeValue: 2.0,
      vatType: FeeType.PERCENTAGE,
      vatValue: 0, // VAT included in fee
      isActive: true,
      midtransCode: 'shopeepay',
    },
    // Credit Card - 2.9% + IDR 2,000 (VAT applies)
    {
      type: PaymentMethodType.CREDIT_CARD as PaymentMethodType,
      bank: null,
      name: 'Kartu Kredit',
      description: 'Bayar dengan kartu kredit Visa, Mastercard, JCB, atau American Express',
      icon: null,
      feeType: FeeType.PERCENTAGE,
      feeValue: 2.9,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11, // 11% VAT on fee
      isActive: true,
      midtransCode: 'credit_card',
    },
    // Mobile Banking - BCA - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.BCA as BankTransferBank,
      name: 'BCA Virtual Account',
      description: 'Transfer melalui BCA Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11, // 11% VAT on fee
      isActive: true,
      midtransCode: 'bca',
    },
    // Mobile Banking - BNI - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.BNI,
      name: 'BNI Virtual Account',
      description: 'Transfer melalui BNI Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'bni',
    },
    // Mobile Banking - Mandiri - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.MANDIRI,
      name: 'Mandiri Virtual Account',
      description: 'Transfer melalui Mandiri Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'mandiri',
    },
    // Mobile Banking - Permata - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.PERMATA,
      name: 'Permata Virtual Account',
      description: 'Transfer melalui Permata Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'permata',
    },
    // Mobile Banking - BRI - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.BRI,
      name: 'BRI Virtual Account',
      description: 'Transfer melalui BRI Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'bri',
    },
    // Mobile Banking - BSI - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.BSI,
      name: 'BSI Virtual Account',
      description: 'Transfer melalui BSI Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'bsi',
    },
    // Mobile Banking - Danamon - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.DANAMON,
      name: 'Danamon Virtual Account',
      description: 'Transfer melalui Danamon Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'danamon',
    },
    // Mobile Banking - CIMB - IDR 4,000 (VAT applies)
    {
      type: PaymentMethodType.MOBILE_BANKING as PaymentMethodType,
      bank: BankTransferBank.CIMB,
      name: 'CIMB Virtual Account',
      description: 'Transfer melalui CIMB Virtual Account',
      icon: null,
      feeType: FeeType.FIXED,
      feeValue: 4000,
      vatType: FeeType.PERCENTAGE,
      vatValue: 11,
      isActive: true,
      midtransCode: 'cimb',
    },
  ];

  for (const pm of paymentMethods) {
    try {
      // Check if payment method exists
      const existing = await prisma.paymentMethod.findFirst({
        where: {
          type: pm.type,
          bank: pm.bank ?? null,
        },
      });

      if (existing) {
        await prisma.paymentMethod.update({
          where: { id: existing.id },
          data: {
            type: pm.type,
            name: pm.name,
            description: pm.description,
            icon: pm.icon,
            feeType: pm.feeType,
            feeValue: pm.feeValue,
            vatType: pm.vatType,
            vatValue: pm.vatValue,
            midtransCode: pm.midtransCode,
            bank: pm.bank,
          },
        });
        console.log(`✅ Payment method updated: ${pm.name}`);
      } else {
        await prisma.paymentMethod.create({
          data: pm,
        });
        console.log(`✅ Payment method created: ${pm.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to seed payment method ${pm.name}:`, error?.message || error);
    }
  }

  console.log('✅ Payment methods seeded successfully!');

  // Seed Coupons
  console.log('\n🌱 Seeding coupons...');

  const coupons = [
    // Welcome coupon - 10% off, max discount 50k
    {
      code: "WELCOME10",
      description: "Selamat datang! Dapatkan diskon 10% untuk pembelian pertama Anda",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minPurchase: 50000,
      maxDiscount: 50000,
      usageLimit: 1000,
      userLimit: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    },
    // Flash sale coupon - 15% off, max discount 100k
    {
      code: "FLASH15",
      description: "Flash sale! Dapatkan diskon 15% untuk pembelian di atas Rp 100.000",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      minPurchase: 100000,
      maxDiscount: 100000,
      usageLimit: 500,
      userLimit: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    },
    // Fixed amount coupon - Rp 20.000 off
    {
      code: "DISKON20K",
      description: "Potongan langsung Rp 20.000 untuk pembelian minimal Rp 50.000",
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 20000,
      minPurchase: 50000,
      maxDiscount: null,
      usageLimit: 2000,
      userLimit: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    },
    // Big discount - 25% off, max 200k
    {
      code: "BIG25",
      description: "Diskon besar! Dapatkan 25% off untuk pembelian di atas Rp 200.000",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 25,
      minPurchase: 200000,
      maxDiscount: 200000,
      usageLimit: 200,
      userLimit: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    },
    // New user special - Rp 10.000 off
    {
      code: "NEWUSER",
      description: "Khusus pengguna baru! Potongan Rp 10.000",
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 10000,
      minPurchase: 30000,
      maxDiscount: null,
      usageLimit: 5000,
      userLimit: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    },
    // Weekend special - 12% off
    {
      code: "WEEKEND12",
      description: "Diskon akhir pekan! Dapatkan 12% off",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 12,
      minPurchase: 75000,
      maxDiscount: 75000,
      usageLimit: null, // Unlimited
      userLimit: 1,
      isActive: true,
      startDate: null,
      endDate: null,
    },
  ];

  for (const coupon of coupons) {
    try {
      await prisma.coupon.upsert({
        where: { code: coupon.code },
        update: {
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minPurchase: coupon.minPurchase,
          maxDiscount: coupon.maxDiscount,
          usageLimit: coupon.usageLimit,
          userLimit: coupon.userLimit,
          isActive: coupon.isActive,
          startDate: coupon.startDate,
          endDate: coupon.endDate,
        },
        create: coupon,
      });
      console.log(`✅ Coupon created: ${coupon.code}`);
    } catch (error: any) {
      console.error(`❌ Failed to seed coupon ${coupon.code}:`, error?.message || error);
    }
  }

  console.log('✅ Coupons seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

