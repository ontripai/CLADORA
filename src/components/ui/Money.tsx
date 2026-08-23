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
 * Uses <bdi> with explicit directionality and .tabular-nums to ensure correct digit and currency order
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

  const isRtl = locale === 'fa';

  return (
    <Component className={`tabular-nums inline-block ${className}`}>
      <bdi dir={isRtl ? 'rtl' : 'ltr'}>{formatted}</bdi>
    </Component>
  );
};
