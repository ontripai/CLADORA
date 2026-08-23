import React from 'react';
import { Locale } from '@/config/locales';
import { 
  SupportedCurrency, 
  DEFAULT_OPERATIONAL_CURRENCY, 
  formatMoney, 
  FormatMoneyOptions 
} from '@/config/currencies';

export interface MoneyProps extends FormatMoneyOptions {
  amount: number;
  currency?: SupportedCurrency;
  locale?: Locale;
  className?: string;
  as?: React.ElementType;
}

/**
 * Reusable Money component for bidirectional-safe monetary rendering
 * Uses <bdi> and .ltr-isolate / .tabular-nums to prevent currency scrambling in RTL
 */
export const Money: React.FC<MoneyProps> = ({
  amount,
  currency = DEFAULT_OPERATIONAL_CURRENCY,
  locale = 'ro',
  showCurrency = true,
  useFullName = false,
  minimumFractionDigits = 2,
  maximumFractionDigits = 2,
  className = '',
  as: Component = 'span',
}) => {
  const formatted = formatMoney(amount, currency, locale, {
    showCurrency,
    useFullName,
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return (
    <Component className={`tabular-nums ${className}`}>
      <bdi className="ltr-isolate">{formatted}</bdi>
    </Component>
  );
};
