/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import ChatButton from '@/components/layout/ChatButton';
import FooterSection from '@/components/layout/Footer';
import Navbar from '@/components/layout/navbar';
import { routing } from '@/i18n/routing';
import set from 'lodash/set';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

function transformMessages(messages: Record<string, unknown>) {
  const transformed: Record<string, unknown> = {};
  Object.entries(messages).forEach(([key, value]) => {
    set(transformed, key, value);
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
    <div className='overflow-x-hidden'>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <main>
          <Navbar />
          {children}
          {/* <FloatingLanguageSelector /> */}
          <FooterSection />
          <ChatButton />
        </main>
      </NextIntlClientProvider>
    </div>
  );
}