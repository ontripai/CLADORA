import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoEnvironmentBannerProps {
  lang: string;
}

export function DemoEnvironmentBanner({ lang }: DemoEnvironmentBannerProps) {
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div
      className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center gap-3 text-xs text-amber-200"
      role="status"
    >
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <div className="flex-1">
        <span className="font-bold">
          {isRo
            ? 'Mediu Demonstrativ / Înregistrări Mock: '
            : isFa
            ? 'محیط آزمایشی / داده‌های نمونه: '
            : 'Demo Environment / Mock Records: '}
        </span>
        <span>
          {isRo
            ? 'Această consolă afișează exemple demonstrative izolate. Nicio dată reală de producție a clienților nu este expusă în această fază (ADR-CLD-023).'
            : isFa
            ? 'این صفحه صرفاً نمونه‌های نمایشی مجزا را نشان می‌دهد. هیچ داده واقعی مشتریان در این بخش بارگذاری نشده است (ADR-CLD-023).'
            : 'This view displays isolated placeholder fixtures. Live customer data is strictly separated in accordance with ADR-CLD-023.'}
        </span>
      </div>
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-900/60 text-amber-300 border border-amber-500/30 shrink-0">
        DEMO FIXTURE
      </span>
    </div>
  );
}
