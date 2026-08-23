/**
 * Centralized Currency Configuration & Locale-Aware Monetary Formatting Architecture
 * Decouples accounting/property currency from UI display locale.
 */

import { Locale, DEFAULT_LOCALE } from '@/config/locales';

export type SupportedCurrency = 'RON' | 'EUR' | 'GBP' | 'USD';

export interface CurrencyMetadata {
  code: SupportedCurrency;
  symbol: string;
  roName: string;
  enName: string;
  faName: string;
  fractionDigits: number;
}

export const currencyConfig: Record<SupportedCurrency, CurrencyMetadata> = {
  RON: {
    code: 'RON',
    symbol: 'RON',
    roName: 'lei',
    enName: 'Romanian leu',
    faName: 'لئوی رومانی',
    fractionDigits: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    roName: 'euro',
    enName: 'euro',
    faName: 'یورو',
    fractionDigits: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    roName: 'lire sterline',
    enName: 'pound sterling',
    faName: 'پوند بریتانیا',
    fractionDigits: 2,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    roName: 'dolari',
    enName: 'US dollar',
    faName: 'دلار آمریکا',
    fractionDigits: 2,
  },
} as const;

export const DEFAULT_OPERATIONAL_CURRENCY: SupportedCurrency = 'RON';
export const DEFAULT_MARKET_CURRENCY: SupportedCurrency = 'RON';

export interface MonetaryContext {
  currency: SupportedCurrency;
  locale: Locale;
}

export interface FormatMoneyOptions {
  showCurrency?: boolean;
  useFullName?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}

/**
 * Get localized name for a currency
 */
export function getLocalizedCurrencyName(currency: SupportedCurrency = 'RON', locale: Locale = 'ro'): string {
  const meta = currencyConfig[currency] || currencyConfig.RON;
  if (locale === 'fa') return meta.faName;
  if (locale === 'en') return meta.enName;
  return meta.roName;
}

/**
 * Locale-aware number formatter
 */
export function formatNumber(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }

  const intlLocaleMap: Record<Locale, string> = {
    ro: 'ro-RO',
    en: 'en-GB',
    fa: 'fa-IR',
  };

  try {
    const intlLocale = intlLocaleMap[locale] || 'ro-RO';
    return new Intl.NumberFormat(intlLocale, options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * Format currency amount with locale-aware decimal/grouping separators and safe label positioning
 */
export function formatMoney(
  amount: number,
  currency: SupportedCurrency = DEFAULT_OPERATIONAL_CURRENCY,
  locale: Locale = DEFAULT_LOCALE,
  options: FormatMoneyOptions = {}
): string {
  const {
    showCurrency = true,
    useFullName = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const formattedNumber = formatNumber(amount, locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (!showCurrency) {
    return formattedNumber;
  }

  const meta = currencyConfig[currency] || currencyConfig.RON;
  const currencyLabel = useFullName ? getLocalizedCurrencyName(currency, locale) : meta.code;

  if (locale === 'fa') {
    // In Persian: amount followed by label e.g. "۱٬۲۳۴٫۵۰ لئوی رومانی" or "۱٬۲۳۴٫۵۰ RON"
    return `${formattedNumber} ${currencyLabel}`;
  }

  if (locale === 'en') {
    // In English: "RON 1,234.50" or "1,234.50 EUR"
    return `${currencyLabel} ${formattedNumber}`;
  }

  // In Romanian: "1.234,50 RON" or "1.234,50 lei"
  return `${formattedNumber} ${currencyLabel}`;
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number,
  locale: Locale = DEFAULT_LOCALE,
  fractionDigits: number = 0
): string {
  const formatted = formatNumber(value, locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  if (locale === 'fa') {
    return `٪${formatted}`;
  }
  return `${formatted}%`;
}

/**
 * Format compact numbers (e.g. 1.2k / ۱٫۲ هزار)
 */
export function formatCompactNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  const intlLocaleMap: Record<Locale, string> = {
    ro: 'ro-RO',
    en: 'en-GB',
    fa: 'fa-IR',
  };

  try {
    const intlLocale = intlLocaleMap[locale] || 'ro-RO';
    return new Intl.NumberFormat(intlLocale, { notation: 'compact' }).format(value);
  } catch {
    return formatNumber(value, locale);
  }
}
