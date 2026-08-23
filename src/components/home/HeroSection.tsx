'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  Building2, 
  TrendingUp, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  PlayCircle
} from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { formatMoney } from '@/config/currencies';

import { getDictionary } from '@/dictionaries';

interface HeroSectionProps {
  lang: Language;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'association' | 'portfolio' | 'manager'>('association');
  const dict = getDictionary(lang);

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#F0F4F8] via-[#F6F9FC] to-[#F6F9FC] mesh-subtle">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#0E9F8E]/10 via-[#2F80ED]/10 to-[#FF7A59]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Pilot Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#B2E5DF] shadow-sm text-xs font-bold text-[#0A6E62]">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>
              {dict.hero.badge}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0E9F8E] rtl:rotate-180" />
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-4xl mx-auto mt-6 space-y-5">
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-[#102A43] tracking-tight leading-[1.15]">
            {dict.hero.titleLine1}{' '}
            <span className="gradient-text-teal">{dict.hero.titleLine2}</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#52667A] max-w-3xl mx-auto leading-relaxed font-normal">
            {dict.hero.description}
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              href={`/${lang}/pilot`}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white font-display font-bold text-base shadow-card-hover hover:scale-[1.02] transition-all"
            >
              <span>{dict.hero.ctaPrimary}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>

            <Link
              href={`/${lang}/demo`}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-white hover:bg-[#F0F4F8] text-[#102A43] border border-[#D3DCE6] font-display font-bold text-base shadow-card transition-all"
            >
              <PlayCircle className="w-5 h-5 text-[#0E9F8E]" />
              <span>{dict.hero.ctaSecondary}</span>
            </Link>
          </div>
        </div>

        {/* 3-OS Experience Switcher */}
        <div className="mt-14 max-w-5xl mx-auto">
          
          <div className="flex justify-center mb-6">
            <div className="p-1.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-card flex flex-wrap gap-2 max-w-2xl w-full">
              
              <button
                type="button"
                onClick={() => setActiveTab('association')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'association'
                    ? 'bg-[#102A43] text-white shadow-md'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <Building2 className={`w-4 h-4 ${activeTab === 'association' ? 'text-[#75CFC3]' : 'text-[#52667A]'}`} />
                <span>Association OS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-[#0E9F8E] text-white shadow-md'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <TrendingUp className={`w-4 h-4 ${activeTab === 'portfolio' ? 'text-white' : 'text-[#52667A]'}`} />
                <span>Portfolio OS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manager')}
                className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'manager'
                    ? 'bg-[#2F80ED] text-white shadow-md'
                    : 'text-[#52667A] hover:text-[#102A43] hover:bg-[#F0F4F8]'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'manager' ? 'text-white' : 'text-[#52667A]'}`} />
                <span>Manager OS</span>
              </button>

            </div>
          </div>

          {/* Dynamic Mockup Card based on OS Switcher */}
          <div className="card-proptech p-6 sm:p-8 border-[#D3DCE6] shadow-elevated bg-white relative overflow-hidden">
            
            {activeTab === 'association' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#087A6E] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#102A43]">
                        {lang === 'ro' 
                          ? 'Asociația de Proprietari Aviației 12B — Închidere Octombrie 2026'
                          : lang === 'fa'
                          ? 'انجمن مالکان مجتمع آویاتسی ۱۲B — بستن دوره ماهانه'
                          : 'Aviației 12B Homeowners Association — October 2026 Month Close'}
                      </h2>
                      <p className="text-xs text-[#334E68]">
                        {lang === 'ro' ? '120 unități · 4 scări · Balanță reconciliată BCR' : lang === 'fa' ? '۱۲۰ واحد مسکونی · ۴ ورودی · تراز تطبیق‌یافته با بانک BCR' : '120 units · 4 entrances · BCR bank reconciled'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] text-xs font-bold border border-[#A7F3D0]">
                      ● {lang === 'ro' ? 'Balanță Echilibrată' : lang === 'fa' ? 'تراز تطبیق‌یافته' : 'Balanced Ledger'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#486581]">
                      {lang === 'ro' ? 'Total Cheltuieli Facturate' : lang === 'fa' ? 'مجموع فاکتورهای دوره' : 'Invoiced Expenses'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      <Money amount={18420.50} currency="RON" locale={lang} />
                    </div>
                    <div className="text-[11px] text-[#047857] mt-1">
                      {lang === 'ro' ? '✓ Alocare integrală pe cote' : lang === 'fa' ? '✓ تسهیم شفاف بر اساس سهم مشاع' : '✓ Full statutory allocation'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#486581]">
                      {lang === 'ro' ? 'Sold Fond Rulment + Reparații' : lang === 'fa' ? 'مانده صندوق سرمایه و تعمیرات' : 'Reserve & Repair Funds'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      <Money amount={45800.00} currency="RON" locale={lang} />
                    </div>
                    <div className="text-[11px] text-[#334E68] mt-1">
                      {lang === 'ro' ? 'Separare pe categorii de conturi' : lang === 'fa' ? 'تفکیک دقیق حساب‌ها بر اساس قانون' : 'Statutory account separation'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">
                      {lang === 'ro' ? 'Contoare Transmise (Apă Rece/Caldă)' : lang === 'fa' ? 'کنتورهای ثبت‌شده (آب سرد و گرم)' : 'Meters Submitted'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#0E9F8E] tabular-nums mt-1">
                      116 / 120 (97%)
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">
                      {lang === 'ro' ? '4 estimate conform metodologiei' : lang === 'fa' ? '۴ واحد برآورد بر اساس میانگین' : '4 estimated per approved rules'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EDF5FF] text-[#2F80ED] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#102A43]">
                        {lang === 'ro' ? 'Portofoliu Rezidențial — 4 Proprietăți în București' : lang === 'fa' ? 'سبد املاک سرمایه‌گذاری — ۴ واحد مسکونی' : 'Residential Portfolio — 4 Units'}
                      </h2>
                      <p className="text-xs text-[#334E68]">
                        {lang === 'ro' ? 'Aviației, Pipera, Titan, Călărași · 100% Închiriate' : lang === 'fa' ? 'واحدهای استیجاری فعال · ۱۰۰٪ مسکونی' : '100% Occupancy Rate'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#EDF5FF] text-[#1E62C4] text-xs font-bold border border-[#BFDBFE]">
                      {lang === 'ro' ? 'Yield Mediu Net: 6.8%' : lang === 'fa' ? 'میانگین بازده خالص: ۶.۸٪' : 'Average Net Yield: 6.8%'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#486581]">
                      {lang === 'ro' ? 'Venit Brut Chirii Lunar' : lang === 'fa' ? 'مجموع اجاره ماهانه ناخالص' : 'Gross Monthly Rent'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      <Money amount={3400.00} currency="EUR" locale={lang} />
                    </div>
                    <div className="text-[11px] text-[#047857] mt-1">
                      {lang === 'ro' ? 'Încasat la zi: 100%' : lang === 'fa' ? 'وصول به‌موقع: ۱۰۰٪' : 'Collected on time: 100%'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#486581]">
                      {lang === 'ro' ? 'Randament Net Estimativ' : lang === 'fa' ? 'بازده خالص برآوردشده' : 'Estimated Net Yield'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      6.8% / {lang === 'ro' ? 'an' : lang === 'fa' ? 'سال' : 'yr'}
                    </div>
                    <div className="text-[11px] text-[#334E68] mt-1">
                      {lang === 'ro' ? 'După cheltuieli & taxe' : lang === 'fa' ? 'پس از کسر هزینه‌ها و مالیات' : 'After operational costs'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#486581]">
                      {lang === 'ro' ? 'Garanții de Bună Execuție' : lang === 'fa' ? 'سپرده‌های تضمین مستأجران' : 'Tenant Security Deposits'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#2F80ED] tabular-nums mt-1">
                      <Money amount={6800.00} currency="EUR" locale={lang} />
                    </div>
                    <div className="text-[11px] text-[#334E68] mt-1">
                      {lang === 'ro' ? 'Conturi escrow monitorizate' : lang === 'fa' ? 'پایش در حساب‌های سپرده امن' : 'Tracked in separate accounts'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'manager' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF7E6] text-[#D99B26] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#102A43]">
                        {lang === 'ro' ? 'ProActive Management SRL — 8 Asociații Condominiale' : lang === 'fa' ? 'شرکت مدیریت املاک — ۸ مجتمع ساختمانی' : 'Management Company — 8 Associations'}
                      </h2>
                      <p className="text-xs text-[#334E68]">
                        {lang === 'ro' ? '680 unități totale · 6 tehnicieni · 14 furnizori activi' : lang === 'fa' ? '۶۸۰ واحد · ۶ تکنسین فعال · ۱۴ تأمین‌کننده طرف قرارداد' : '680 total units · 6 field technicians'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF7E6] text-[#B45309] text-xs font-bold border border-[#FDE68A]">
                      {lang === 'ro' ? 'SLA Mentenanță: 98.4%' : lang === 'fa' ? 'شاخص SLA تعمیرات: ۹۸.۴٪' : 'Maintenance SLA: 98.4%'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">
                      {lang === 'ro' ? 'Închidere Lună Centralizată' : lang === 'fa' ? 'بستن دوره‌های ماهانه' : 'Batch Month-Close'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      {lang === 'ro' ? '7 / 8 Închise' : lang === 'fa' ? '۷ از ۸ بسته شد' : '7 / 8 Closed'}
                    </div>
                    <div className="text-[11px] text-[#059669] mt-1">
                      {lang === 'ro' ? '1 în validare cenzor' : lang === 'fa' ? '۱ مجتمع در مرحله تأیید بازرس' : '1 awaiting auditor review'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">
                      {lang === 'ro' ? 'Tichete Mentenanță Deschise' : lang === 'fa' ? 'تیکت‌های فعال تعمیرات' : 'Open Work Orders'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#102A43] tabular-nums mt-1">
                      {lang === 'ro' ? '3 Active' : lang === 'fa' ? '۳ تیکت فعال' : '3 Active'}
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">
                      {lang === 'ro' ? 'Timp mediu rezolvare: 2.4 ore' : lang === 'fa' ? 'میانگین زمان حل: ۲.۴ ساعت' : 'Avg resolution: 2.4 hrs'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0]">
                    <div className="text-xs font-semibold text-[#7B8A9A]">
                      {lang === 'ro' ? 'Eficiență Operațională Echipă' : lang === 'fa' ? 'بهره‌وری عملیاتی کارکنان' : 'Operational Efficiency'}
                    </div>
                    <div className="text-xl font-display font-extrabold text-[#10B981] tabular-nums mt-1">
                      +45% {lang === 'ro' ? 'Timp Salvat' : lang === 'fa' ? 'صرفه‌جویی در زمان' : 'Time Saved'}
                    </div>
                    <div className="text-[11px] text-[#52667A] mt-1">
                      {lang === 'ro' ? 'Prin reconciliere bancară automată' : lang === 'fa' ? 'به کمک تطبیق خودکار تراکنش‌ها' : 'Via automated bank matching'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-[#E2E8F0] text-xs text-[#52667A]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0E9F8E]" />
                <span>
                  {lang === 'ro' 
                    ? 'Un singur model de date și permisiuni între cele 3 medii.' 
                    : lang === 'fa'
                    ? 'یک مدل داده واحد با تفکیک سطوح دسترسی میان ۳ حالت عملیاتی.'
                    : 'One shared data model, identity, and permissions core.'}
                </span>
              </div>
              <Link
                href={`/${lang}/demo`}
                className="font-bold text-[#0E9F8E] hover:underline flex items-center gap-1"
              >
                <span>{lang === 'ro' ? 'Lansează în Demo' : lang === 'fa' ? 'مشاهده در محیط دمو' : 'Launch in Demo'}</span>
                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
