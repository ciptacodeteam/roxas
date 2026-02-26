import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

type Messages = Record<string, string>;

export default getRequestConfig(async ({ requestLocale }) => {
  
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // 💡 PERBAIKAN UTAMA: Mengganti alias (@/locales) dengan jalur relatif (../locales).
  // Jalur relatif ini harus disesuaikan berdasarkan lokasi file ini
  // relatif terhadap folder 'src/locales'.
  const messages = (await import(`../locales/${locale}.json`)).default as Messages;

  return {
    locale,
    messages,
  };
});