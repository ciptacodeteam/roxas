import { defineRouting } from 'next-intl/routing';

export const locales = ['id', 'en', 'zh'];

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'id',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];