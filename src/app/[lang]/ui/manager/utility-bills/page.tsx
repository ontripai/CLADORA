import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { UtilityBillsWorkspace } from '@/components/manager/utility-bills/UtilityBillsWorkspace';
import { ChevronRight, Layers, ArrowLeft } from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/ui/manager/utility-bills', params.lang);
}

export default function UtilityBillsPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="pt-28 pb-24 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Link href={`/${lang}/manager`} className="hover:text-slate-200 transition-colors">
          {isRo ? 'Manager OS' : isFa ? 'کنسول مدیریت' : 'Manager OS'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <Link href={`/${lang}/ui/manager`} className="hover:text-slate-200 transition-colors">
          {isRo ? 'Financiar & Contabilitate' : isFa ? 'مالی و حسابداری' : 'Finance & Accounting'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-violet-400 font-semibold">
          {isRo ? 'M25 Facturi Utilități & OCR' : isFa ? 'M25 قبوض آب و برق و هوش پردازش' : 'M25 Utility Bills & OCR'}
        </span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Workspace M25 • Finance & Utility Accounting</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
            {isRo
              ? 'Facturi Utilități & Procesare Inteligentă'
              : isFa
              ? 'قبوض آب و برق و هوش پردازش صورت‌حساب‌ها'
              : 'Utility Bills & Invoice Intelligence'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            {isRo
              ? 'Ingestie multi-canal, extracție automată de date, reconciliere indexuri contor și aprobare umană obligatorie conform Legii 196/2018.'
              : isFa
              ? 'دریافت چندکاناله، استخراج خودکار داده‌ها، تطبیق شاخص کنتور و تأیید نهایی انسانی بر اساس ضوابط قانونی.'
              : 'Multi-channel invoice ingestion, OCR parsing, meter index reconciliation, and mandatory authorized human sign-off.'}
          </p>
        </div>

        <Link
          href={`/${lang}/manager`}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/80 inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isRo ? 'Înapoi la Manager OS' : isFa ? 'بازگشت به پنل مدیریت' : 'Back to Manager OS'}</span>
        </Link>
      </div>

      {/* Full Interactive Workspace Component */}
      <UtilityBillsWorkspace lang={lang} />
    </div>
  );
}
