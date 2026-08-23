/**
 * Centralized Internationalization & Locale Configuration
 * Single Source of Truth for CLADORA Multi-Language & RTL Architecture
 */

export const localeConfig = {
  ro: {
    code: 'ro',
    intlLocale: 'ro-RO',
    nativeName: 'Română',
    englishName: 'Romanian',
    direction: 'ltr',
    region: 'RO',
    flag: 'ro',
    fontFamily: 'var(--font-inter)',
    isRtl: false,
    currency: 'RON',
  },
  en: {
    code: 'en',
    intlLocale: 'en-GB',
    nativeName: 'English',
    englishName: 'English',
    direction: 'ltr',
    region: 'GB',
    flag: 'gb',
    fontFamily: 'var(--font-inter)',
    isRtl: false,
    currency: 'EUR',
  },
  fa: {
    code: 'fa',
    intlLocale: 'fa-IR',
    nativeName: 'فارسی',
    englishName: 'Persian',
    direction: 'rtl',
    region: 'IR',
    flag: 'ir',
    fontFamily: 'var(--font-vazirmatn)',
    isRtl: true,
    currency: 'EUR',
  },
} as const;

export type Locale = keyof typeof localeConfig;
export type Language = Locale;
export type Direction = 'ltr' | 'rtl';

export const SUPPORTED_LOCALES = Object.keys(localeConfig) as Locale[];
export const DEFAULT_LOCALE: Locale = 'ro';

/**
 * Type guard to check if a string is a supported locale
 */
export function isSupportedLocale(value: string): value is Locale {
  return Object.prototype.hasOwnProperty.call(localeConfig, value);
}

/**
 * Get layout direction ('ltr' | 'rtl') for any locale
 */
export function getLocaleDirection(locale: string): Direction {
  if (isSupportedLocale(locale)) {
    return localeConfig[locale].direction;
  }
  return 'ltr';
}

/**
 * Check if a locale is Right-to-Left (RTL)
 */
export function isRtlLocale(locale: string): boolean {
  return getLocaleDirection(locale) === 'rtl';
}

/**
 * Get standard BCP-47 / Intl locale string (e.g. 'ro-RO', 'en-GB', 'fa-IR')
 */
export function getIntlLocale(locale: string): string {
  if (isSupportedLocale(locale)) {
    return localeConfig[locale].intlLocale;
  }
  return 'ro-RO';
}

/**
 * Get full config record for a locale
 */
export function getLocaleConfig(locale: string) {
  if (isSupportedLocale(locale)) {
    return localeConfig[locale];
  }
  return localeConfig[DEFAULT_LOCALE];
}
