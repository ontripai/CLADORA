'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  FileSpreadsheet, 
  Scale, 
  RotateCcw, 
  FileCheck2, 
  Receipt,
  Info
} from 'lucide-react';
import { MOCK_CHARGE_BREAKDOWN } from '@/data/mockData';

interface FinancialTruthSectionProps {
  lang: Language;
}

export const FinancialTruthSection: React.FC<FinancialTruthSectionProps> = ({ lang }) => {
  const [selectedLine, setSelectedLine] = useState<string>(MOCK_CHARGE_BREAKDOWN[0].id);

  const currentItem = MOCK_CHARGE_BREAKDOWN.find(item => item.id === selectedLine) || MOCK_CHARGE_BREAKDOWN[0];

  return (
    <section className="py-24 bg-white border-b border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C01 & C02' : lang === 'fa' ? 'هسته‌های نرم‌افزاری C01 و C02' : 'C01 & C02 Core'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' ? 'Un singur adevăr financiar pentru fiecare leu' : lang === 'fa' ? 'یک حقیقت مالی شفاف برای هر ریال شارژ' : 'One Financial Source of Truth for Every Cent'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Fiecare sumă are o sursă. Fiecare cheltuială are o regulă de alocare. Fără ștergeri neautorizate — doar stornări înregistrate cu hash de audit.'
              : lang === 'fa'
              ? 'هر رقم دارای فاکتور مرجع است. هر هزینه از یک فرمول مشخص تبعیت می‌کند. بدون حذف خام اطلاعات؛ صرفاً اسناد اصلاحی با ردپای حسابرسی.'
              : 'Every financial amount traces to a source invoice. Every expense follows an immutable rule. Zero silent deletions — strictly auditable reversals.'}
          </p>
        </div>

        {/* 4 Pillars of Financial Truth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          
          <div className="card-proptech p-5 space-y-2 border-l-4 border-l-[#102A43]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
              <FileSpreadsheet className="w-4 h-4 text-[#0E9F8E]" />
              <span>{lang === 'ro' ? 'Partidă Dublă Verificabilă' : lang === 'fa' ? 'حسابداری دوطرفه دفتر کل' : 'True Double-Entry'}</span>
            </div>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' 
                ? 'Plan de conturi adaptat asociațiilor de proprietari. Balanță contabilă mereu echilibrată Debit = Credit.' 
                : lang === 'fa'
                ? 'کدینگ استاندارد حساب‌ها متناسب با مجتمع‌ها. تراز مالی همواره تراز با برابری بدهکار و بستانکار.'
                : 'Full general ledger with debit/credit balance validation across all fund accounts.'}
            </p>
          </div>

          <div className="card-proptech p-5 space-y-2 border-l-4 border-l-[#0E9F8E]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
              <Scale className="w-4 h-4 text-[#0E9F8E]" />
              <span>{lang === 'ro' ? 'Alocare 100% Explicabilă' : lang === 'fa' ? 'تخصیص شفاف و قابل دفاع' : 'Explainable Math'}</span>
            </div>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' 
                ? 'Cote părți indivize (CPI), număr persoane, suprafață utilă sau consum contoare, vizibile detaliat fiecărui proprietar.' 
                : lang === 'fa'
                ? 'تسهیم بر مبنای سهام مشاع (CPI)، تعداد نفرات یا کنتورهای فرعی، قابل مشاهده با جزئیات برای هر مالک.'
                : 'Statutory CPI, surface area, resident counts, and meter consumption rules.'}
            </p>
          </div>

          <div className="card-proptech p-5 space-y-2 border-l-4 border-l-[#FF7A59]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
              <RotateCcw className="w-4 h-4 text-[#FF7A59]" />
              <span>{lang === 'ro' ? 'Stornare, Nu Ștergere' : lang === 'fa' ? 'سند اصلاحی، نه حذف سوابق' : 'Reversals Not Deletions'}</span>
            </div>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' 
                ? 'Erorile se corectează exclusiv prin tranzacții de stornare. Istoricul financiar este protejat de modificări retroactive.' 
                : lang === 'fa'
                ? 'خطاها صرفاً از طریق صدور سند برگشتی اصلاح می‌شوند. سوابق مالی در برابر تغییرات سلیقه‌ای محافظت شده‌اند.'
                : 'Past accounting entries are never silently deleted; corrections require explicit reversing entries.'}
            </p>
          </div>

          <div className="card-proptech p-5 space-y-2 border-l-4 border-l-[#2F80ED]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#102A43]">
              <FileCheck2 className="w-4 h-4 text-[#2F80ED]" />
              <span>{lang === 'ro' ? 'Pachet Audit Cenzor' : lang === 'fa' ? 'پکیج ممیزی بازرس و حسابرس' : 'Censor Audit Package'}</span>
            </div>
            <p className="text-xs text-[#52667A] leading-relaxed">
              {lang === 'ro' 
                ? 'Raport complet de audit generat la un click: reconciliere bancară, facturi nealocate, jurnale operațiuni.' 
                : lang === 'fa'
                ? 'گزارش حسابرسی آماده با یک کلیک: تطبیق صورت‌حساب بانکی، کنترل فاکتورها و دفاتر روزنامه.'
                : 'One-click verification reports with bank balance match and missing document alerts.'}
            </p>
          </div>

        </div>

        {/* Interactive Charge Breakdown Drill-down */}
        <div className="mt-14 card-proptech p-6 sm:p-8 bg-[#F6F9FC] border-[#D3DCE6]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div>
              <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
                {lang === 'ro' ? 'Simulare Interactivă Notă de Plată' : lang === 'fa' ? 'شبیه‌ساز تعاملی فیش شارژ ماهانه' : 'Interactive Charge Drill-Down Demo'}
              </span>
              <h3 className="text-xl font-bold text-[#102A43] mt-1">
                {lang === 'ro' 
                  ? 'Cum se descompune o linie de întreținere (Ap. 14 — 78 mp)' 
                  : lang === 'fa'
                  ? 'کالبدشکافی ردیف‌های شارژ ماهانه (واحد ۱۴ — ۷۸ متر مربع)'
                  : 'Deconstruction of a Monthly Statement Line (Apt. 14 — 78 sqm)'}
              </h3>
            </div>
            <div className="text-xs text-[#52667A]">
              {lang === 'ro' ? 'Apasă pe o linie pentru a vedea sursa din spate:' : lang === 'fa' ? 'روی هر ردیف کلیک کنید تا سند منبع را ببینید:' : 'Click a line to drill down into source calculation:'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            
            {/* Lines List */}
            <div className="lg:col-span-6 space-y-2">
              {MOCK_CHARGE_BREAKDOWN.map((line) => (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setSelectedLine(line.id)}
                  className={`w-full text-start p-4 rounded-xl transition-all border flex items-center justify-between ${
                    selectedLine === line.id
                      ? 'bg-white border-[#0E9F8E] shadow-card ring-1 ring-[#0E9F8E]'
                      : 'bg-white/60 hover:bg-white border-[#E2E8F0]'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-[#102A43]">{line.expenseCategory}</div>
                    <div className="text-xs text-[#52667A] mt-0.5 font-mono">
                      <span className="ltr-isolate">{line.supplierInvoiceRef}</span> · {lang === 'ro' ? 'Metodă:' : lang === 'fa' ? 'روش:' : 'Method:'} {line.allocationMethod}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-display font-extrabold text-[#102A43] tabular-nums">
                      {line.calculatedAmount.toFixed(2)} RON
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">
                      {line.operationalPayer === 'TENANT' 
                        ? (lang === 'ro' ? 'Chiriaș / Consum' : lang === 'fa' ? 'مستأجر / مصرف' : 'Tenant / Use') 
                        : (lang === 'ro' ? 'Proprietar' : lang === 'fa' ? 'مالک واحد' : 'Owner')}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Drill-down Detail Panel */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl border border-[#D3DCE6] p-6 space-y-5 shadow-card">
                
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-[#0E9F8E]" />
                    <span className="text-sm font-bold text-[#102A43]">
                      {lang === 'ro' ? 'Fișă Justificativă de Calcul' : lang === 'fa' ? 'برگه اثبات محاسباتی سند' : 'Statutory Allocation Proof'}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#7B8A9A]">ID: <span className="ltr-isolate">{currentItem.id}</span></span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-3 rounded-lg bg-[#F6F9FC]">
                    <span className="text-[#52667A]">
                      {lang === 'ro' ? 'Factură Furnizor Sursă:' : lang === 'fa' ? 'فاکتور مرجع تأمین‌کننده:' : 'Source Supplier Invoice:'}
                    </span>
                    <span className="font-bold text-[#102A43] font-mono ltr-isolate">{currentItem.supplierInvoiceRef}</span>
                  </div>

                  <div className="flex justify-between p-3 rounded-lg bg-[#F6F9FC]">
                    <span className="text-[#52667A]">
                      {lang === 'ro' ? 'Total Factură Asociație:' : lang === 'fa' ? 'مجموع فاکتور کل ساختمان:' : 'Total Association Invoice:'}
                    </span>
                    <span className="font-bold text-[#102A43] tabular-nums font-mono">{currentItem.totalInvoiceAmount.toFixed(2)} RON</span>
                  </div>

                  <div className="flex justify-between p-3 rounded-lg bg-[#F6F9FC]">
                    <span className="text-[#52667A]">
                      {lang === 'ro' ? 'Cota Parte / Bază de Calcul Ap. 14:' : lang === 'fa' ? 'سهم مشاع واحد ۱۴:' : 'Share Ratio for Unit 14:'}
                    </span>
                    <span className="font-bold text-[#0E9F8E] tabular-nums">{currentItem.unitSharePercent}%</span>
                  </div>

                  <div className="flex justify-between p-3 rounded-lg bg-[#EAF8F5] border border-[#B2E5DF]">
                    <span className="font-bold text-[#0A6E62]">
                      {lang === 'ro' ? 'Sumă Datorată de Apartament:' : lang === 'fa' ? 'مبلغ سهم محاسبه‌شده واحد:' : 'Calculated Share Due:'}
                    </span>
                    <span className="font-extrabold text-[#0A6E62] text-sm tabular-nums">{currentItem.calculatedAmount.toFixed(2)} RON</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFF7E6] border border-[#FDE68A] flex items-start gap-2.5 text-xs text-[#92400E]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
                  <span>
                    {lang === 'ro'
                      ? 'Conform Legea 196/2018: Debitorul legal în fața asociației rămâne proprietarul, dar CLADORA separă automat costul operațional pentru decontarea cu chiriașul.'
                      : lang === 'fa'
                      ? 'یادداشت قانونی: مدیون رسمی در برابر انجمن مالکان همواره مالک واحد است؛ کلادورا سهم مصارف روزمره را جهت تسویه آسان با مستأجر به‌طور خودکار تفکیک می‌کند.'
                      : 'Statutory Note: The legal debtor to the association is the unit owner; CLADORA isolates operational charges for tenant settlement.'}
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
