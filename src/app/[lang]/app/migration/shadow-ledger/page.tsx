'use client';

import React from 'react';
import { Language } from '@/types';
import { Database, ShieldCheck, RefreshCw } from 'lucide-react';
import { ShadowLedgerDemo } from '@/components/interactive/ShadowLedgerDemo';

export default function ShadowLedgerAppPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C16 — Consola de Migrare Shadow Ledger' 
              : lang === 'fa' 
              ? 'هسته C16 — کنسول مهاجرت سوابق با پروتکل دفتر کل موازی' 
              : 'Core C16 — Shadow Ledger Migration Console'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Reconciliere Migrare Shadow Ledger' : lang === 'fa' ? 'تطبیق و کشف مغایرت‌های سامانه‌های قدیمی' : 'Shadow Ledger Reconciliation'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Verificare paralelă a balanței și detecție automată a discrepanțelor din softul vechi' 
              : lang === 'fa' 
              ? 'اجرای موازی دوره‌ها و کشف خودکار خطاهای محاسباتی، جریمه‌ها و کنتورهای نرم‌افزارهای قبلی' 
              : 'Parallel ledger verification and automated variance discovery from legacy spreadsheets'}
          </p>
        </div>
      </div>

      <ShadowLedgerDemo lang={lang} />

    </div>
  );
}
