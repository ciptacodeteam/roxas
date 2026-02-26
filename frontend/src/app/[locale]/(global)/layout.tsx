import ChatButton from '@/components/layout/ChatButton';
import FooterSection from '@/components/layout/Footer';
import Navbar from '@/components/layout/navbar';
import { Toaster } from '@/components/ui/sonner';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { RoleGuard } from '@/components/auth/role-guard';

function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (typeof cur[key] !== 'object' || cur[key] === null) cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]!] = value;
}

function transformMessages(messages: Record<string, unknown>) {
  const transformed: Record<string, unknown> = {};
  Object.entries(messages).forEach(([key, value]) => {
    setPath(transformed, key, value);
  });
  return transformed;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;

  const { locale } = resolvedParams;

  const messages = transformMessages(await getMessages());

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <div>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <RoleGuard type="public" />
        <main>
          <Navbar />
          {children}
          {/* <FloatingLanguageSelector /> */}
          <FooterSection />
          <ChatButton />
          <Toaster />
        </main>
      </NextIntlClientProvider>
    </div>
  );
}