import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { UtilityBillsWorkspace } from '@/components/manager/utility-bills/UtilityBillsWorkspace';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers, Zap } from 'lucide-react';

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

export default function UtilityBillsWorkspacePage({
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
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#52667A]">
        <Link href={`/${lang}/ui/manager`} className="hover:text-[#102A43] transition-colors">
          {isRo ? 'Manager OS' : isFa ? 'سیستم مدیریت' : 'Manager OS'}
        </Link>
        <span>/</span>
        <Link href={`/${lang}/app/accounting`} className="hover:text-[#102A43] transition-colors">
          {isRo ? 'Financiar & Contabilitate' : isFa ? 'مالی و حسابداری' : 'Finance & Accounting'}
        </Link>
        <span>/</span>
        <span className="font-bold text-[#0A6E62]">
          {isRo ? 'M25 Facturi Utilități & OCR' : isFa ? 'M25 قبوض آب و برق و هوش پردازش' : 'M25 Utility Bills & OCR'}
        </span>
      </nav>

      {/* Hero Workspace Header */}
      <div className="card-proptech p-6 sm:p-8 bg-white border-[#E2E8F0] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 text-start">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF8F5] border border-[#B2E5DF] text-xs font-bold text-[#0A6E62]">
            <Layers className="w-3.5 h-3.5 text-[#0A6E62]" />
            <span>Workspace M25 • Finance & Utility Accounting</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43] tracking-tight">
            {isRo
              ? 'Facturi Utilități & Procesare Inteligentă'
              : isFa
              ? 'قبوض آب و برق و هوش پردازش صورت‌حساب‌ها'
              : 'Utility Bills & Invoice Intelligence'}
          </h1>
          <p className="text-sm text-[#52667A] leading-relaxed">
            {isRo
              ? 'Ingestie multi-canal, extracție automată de date, reconciliere indexuri contor și aprobare umană obligatorie conform Legii 196/2018.'
              : isFa
              ? 'دریافت چندکاناله، استخراج خودکار داده‌ها، تطبیق شاخص کنتور و تأیید نهایی توسط کاربر مجاز بر اساس ضوابط قانونی.'
              : 'Multi-channel invoice ingestion, OCR parsing, meter index reconciliation, and mandatory authorized human sign-off.'}
          </p>
        </div>

        <Link
          href={`/${lang}/ui/manager`}
          className="px-4 py-2.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] text-xs font-bold border border-[#D3DCE6] inline-flex items-center gap-2 self-start md:self-auto transition-all shadow-sm shrink-0"
        >
          {isFa ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{isRo ? 'Înapoi la Manager OS' : isFa ? 'بازگشت به پنل مدیریت' : 'Back to Manager OS'}</span>
        </Link>
      </div>

      {/* Main Workspace Interactive Engine */}
      <UtilityBillsWorkspace lang={params.lang} />
    </div>
  );
}
