import React from 'react';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { ShadowLedgerDemo } from '@/components/interactive/ShadowLedgerDemo';
import { Layers } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  const isFa = params.lang === 'fa';
  return {
    title: isRo 
      ? 'Migrare Controlată din Xisoft, Aviziero, Excel (Shadow Ledger) | CLADORA' 
      : isFa
      ? 'مهاجرت امن سوابق مالی با پروتکل Shadow Ledger | کلادورا'
      : 'Safe Legacy Migration with Shadow Ledger Protocol | CLADORA',
    description: isRo
      ? 'Tranziție garantată fără pierderi de date din vechiul program de administrare. Rulare paralelă timp de 2 luni până la reconcilierea completă a soldurilor.'
      : isFa
      ? 'انتقال تضمینی و بدون نقص داده‌ها از نرم‌افزارهای قبلی و فایل‌های اکسل. اجرای موازی تا تطبیق ۱۰۰ درصدی مانده‌حساب‌ها.'
      : 'Guaranteed zero-loss data transition from legacy software. Run parallel Shadow Ledger billing for 2 months until every balance is mathematically matched.',
  };
}

export default function MigrationPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
          <Layers className="w-3.5 h-3.5" />
          <span>Core C16</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {dict.migrationSection.title}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.migrationSection.description}
        </p>
      </div>

      {/* 4 Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dict.migrationSection.steps.map((st) => (
          <div key={st.step} className="p-6 rounded-2xl glass-panel border border-white/10 space-y-2">
            <span className="font-mono text-3xl font-extrabold text-brand-400 block ltr-isolate">{st.step}</span>
            <h3 className="text-base font-bold text-white">{st.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
          </div>
        ))}
      </div>

      {/* Interactive Demo */}
      <ShadowLedgerDemo lang={lang} />

      {/* Compatibility Callout */}
      <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">
          {isRo 
            ? 'Sisteme Suportate pentru Migrare Directă' 
            : isFa
            ? 'سامانه‌های پشتیبانی‌شده برای فراخوانی و مهاجرت مستقیم'
            : 'Supported Legacy Systems for Ingestion'}
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-300">
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">Xisoft / Bloc Manager NET</span>
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">Aviziero.ro</span>
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">Platformis.ro</span>
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">Homefile.ro</span>
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">MyBloc.ro</span>
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">{isRo ? 'Fișiere Excel / CSV' : isFa ? 'فایل‌های اکسل / CSV' : 'Excel / CSV Files'}</span>
          <span className="px-3.5 py-2 rounded-xl bg-surface-100 border border-white/10">{isRo ? 'Scanări PDF de Liste' : isFa ? 'فایل‌های اسکن‌شده PDF صورت‌حساب' : 'Scanned PDF Statements'}</span>
        </div>
      </div>

    </div>
  );
}
