'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Calculator, TrendingUp, Sparkles, Building, CheckCircle, ArrowRight } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { formatNumber, formatMoney } from '@/config/currencies';

interface SavingsCalculatorProps {
  lang: Language;
}

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({ lang }) => {
  const [archetype, setArchetype] = useState<'A1' | 'A2' | 'A3' | 'A4' | 'A5'>('A1');
  const [apartments, setApartments] = useState<number>(60);
  const [monthlyUtilityBill, setMonthlyUtilityBill] = useState<number>(18000);

  const archetypeMultipliers = {
    A1: { 
      name: lang === 'ro' ? 'A1: Bloc Clasic Pre-1990 (Coloane / RADET)' : lang === 'fa' ? 'A1: بلوک سنتی قبل از ۱۹۹۰ (تأسیسات مشترک)' : 'A1: Pre-1990 Classic Building (Central Riser)', 
      leakRate: 0.22, 
      adminSaving: 0.45 
    },
    A2: { 
      name: lang === 'ro' ? 'A2: Bloc Reabilitat Termic' : lang === 'fa' ? 'A2: ساختمان عایق‌کاری‌شده و نوسازی حرارتی' : 'A2: Thermally Retrofitted Building', 
      leakRate: 0.14, 
      adminSaving: 0.40 
    },
    A3: { 
      name: lang === 'ro' ? 'A3: Imobil 1990–2010 (Centrale / Mixte)' : lang === 'fa' ? 'A3: ساختمان ساخت ۱۹۹۰ تا ۲۰۱۰ (پکیج / سیستم ترکیبی)' : 'A3: 1990–2010 Building (Individual Boiler)', 
      leakRate: 0.18, 
      adminSaving: 0.40 
    },
    A4: { 
      name: lang === 'ro' ? 'A4: Complex Rezidențial Nou (Facilități / Parcări)' : lang === 'fa' ? 'A4: مجتمع نوساز مدرن (امکانات کامل / پارکینگ)' : 'A4: Modern Residential Complex (Amenities / Parking)', 
      leakRate: 0.25, 
      adminSaving: 0.50 
    },
    A5: { 
      name: lang === 'ro' ? 'A5: Ansamblu Vile / Comunitate Închisă' : lang === 'fa' ? 'A5: شهرک ویلایی / مجتمع محصور' : 'A5: Gated Villa Community', 
      leakRate: 0.20, 
      adminSaving: 0.45 
    },
  };

  const selected = archetypeMultipliers[archetype];

  // Calculations
  const annualUtilities = monthlyUtilityBill * 12;
  const estimatedUtilitySavingsAnnual = annualUtilities * (selected.leakRate * 0.7); // conservative estimate
  const estimatedAdminHoursSavedMonthly = apartments * 0.75;
  const totalVerifiedSavingsAnnual = estimatedUtilitySavingsAnnual + (apartments * 240); // including maintenance optimization
  const perApartmentAnnualSaving = totalVerifiedSavingsAnnual / apartments;

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'ro' 
                ? 'Calculator ROI & Economii Verificate (Core C14 & C15)' 
                : lang === 'fa'
                ? 'محاسبه‌گر بازده سرمایه‌گذاری و صرفه‌جویی ملموس (هسته C14 و C15)'
                : 'Building DNA & ROI Calculator (Core C14 & C15)'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            {lang === 'ro' 
              ? 'Estimează Economiile Reale pentru Blocul Tău' 
              : lang === 'fa'
              ? 'برآورد صرفه‌جویی واقعی برای ساختمان یا مجتمع شما'
              : 'Calculate Verifiable Savings for Your Building'}
          </h3>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-200">
          {lang === 'ro' ? 'Garanție de Măsurare' : lang === 'fa' ? 'پروتکل سنجش تغییرناپذیر' : 'Verified Ledger Protocol'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Sliders and Inputs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Archetype selector */}
          <div className="space-y-2">
            <label htmlFor="archetypeSelect" className="text-xs font-semibold text-slate-200">
              {lang === 'ro' ? 'Tipologia / Arhetipul Clădirii:' : lang === 'fa' ? 'گونه‌شناسی و تیپ ساختمانی:' : 'Building Archetype:'}
            </label>
            <select
              id="archetypeSelect"
              name="archetypeSelect"
              aria-label={lang === 'ro' ? 'Selectează arhetipul clădirii' : lang === 'fa' ? 'انتخاب گونه‌شناسی ساختمان' : 'Select building archetype'}
              value={archetype}
              onChange={(e) => setArchetype(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-100 border border-white/15 text-sm text-white focus:border-emerald-400 focus:outline-none"
            >
              <option value="A1">A1: {lang === 'ro' ? 'Bloc Clasic Pre-1990 (Coloane / RADET)' : lang === 'fa' ? 'بلوک سنتی قبل از ۱۹۹۰ (تأسیسات مشترک)' : 'Pre-1990 Classic Building'}</option>
              <option value="A2">A2: {lang === 'ro' ? 'Bloc Reabilitat Termic' : lang === 'fa' ? 'ساختمان نوسازی و عایق‌کاری‌شده حرارتی' : 'Thermic Retrofitted Building'}</option>
              <option value="A3">A3: {lang === 'ro' ? 'Imobil 1990–2010 (Centrale / Mixte)' : lang === 'fa' ? 'ساختمان ساخت ۱۹۹۰ تا ۲۰۱۰ (پکیج / سیستم ترکیبی)' : '1990–2010 Building'}</option>
              <option value="A4">A4: {lang === 'ro' ? 'Complex Rezidențial Nou (Facilități / Parcări)' : lang === 'fa' ? 'مجتمع مسکونی نوساز (امکانات مدرن / پارکینگ)' : 'Modern Residential Complex'}</option>
              <option value="A5">A5: {lang === 'ro' ? 'Ansamblu Vile / Comunitate Închisă' : lang === 'fa' ? 'شهرک ویلایی / مجتمع محصور' : 'Gated Villa Community'}</option>
            </select>
          </div>

          {/* Apartments count slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="apartmentsRangeInput" className="text-slate-200 font-semibold">
                {lang === 'ro' ? 'Număr Apartamente:' : lang === 'fa' ? 'تعداد واحدها:' : 'Number of Units:'}
              </label>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatNumber(apartments, lang)} {lang === 'ro' ? 'unități' : lang === 'fa' ? 'واحد' : 'units'}
              </span>
            </div>
            <input
              id="apartmentsRangeInput"
              name="apartmentsRangeInput"
              aria-label={lang === 'ro' ? 'Număr apartamente în clădire' : lang === 'fa' ? 'تعداد واحدهای مجتمع' : 'Number of units in building'}
              type="range"
              min="10"
              max="300"
              step="5"
              value={apartments}
              onChange={(e) => setApartments(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Monthly utilities bill slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label htmlFor="utilityBillRangeInput" className="text-slate-200 font-semibold">
                {lang === 'ro' ? 'Total Facturi Utilități Lunare Bloc:' : lang === 'fa' ? 'مجموع فاکتورهای ماهانه انشعابات ساختمان:' : 'Monthly Building Utility Invoices:'}
              </label>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                <Money amount={monthlyUtilityBill} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
              </span>
            </div>
            <input
              id="utilityBillRangeInput"
              name="utilityBillRangeInput"
              aria-label={lang === 'ro' ? 'Total facturi lunare bloc în RON' : lang === 'fa' ? 'مجموع فاکتورهای ماهانه به لئوی رومانی' : 'Monthly utility bill in RON'}
              type="range"
              min="3000"
              max="80000"
              step="1000"
              value={monthlyUtilityBill}
              onChange={(e) => setMonthlyUtilityBill(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Output Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-surface-100/80 border border-emerald-500/20 space-y-4 glow-box-emerald">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {lang === 'ro' ? 'Economii Anuale Estimate prin CLADORA' : lang === 'fa' ? 'مجموع صرفه‌جویی سالانه برآوردشده با کلادورا' : 'Estimated Annual Realized Savings'}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-display font-extrabold text-emerald-400">
                <Money amount={Math.round(totalVerifiedSavingsAnnual)} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
              </span>
              <span className="text-base font-mono text-slate-200">
                / {lang === 'ro' ? 'an' : lang === 'fa' ? 'سال' : 'year'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-300 block">
                  {lang === 'ro' ? 'Economie per Apartament:' : lang === 'fa' ? 'صرفه‌جویی به ازای هر واحد:' : 'Saving per Unit:'}
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  ~<Money amount={Math.round(perApartmentAnnualSaving)} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} /> / {lang === 'ro' ? 'an' : lang === 'fa' ? 'سال' : 'year'}
                </span>
              </div>
              <div>
                <span className="text-slate-300 block">
                  {lang === 'ro' ? 'Ore de Muncă Salvate:' : lang === 'fa' ? 'کاهش ساعات کار اداری:' : 'Admin Hours Saved:'}
                </span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  ~{formatNumber(Math.round(estimatedAdminHoursSavedMonthly), lang)} {lang === 'ro' ? 'ore / lună' : lang === 'fa' ? 'ساعت / ماه' : 'hours / month'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-white/5 text-xs text-slate-200 space-y-1.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ro' ? 'Cum se realizează această economie?' : lang === 'fa' ? 'این صرفه‌جویی چگونه حاصل می‌شود؟' : 'How are these savings achieved?'}</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {lang === 'ro'
                ? 'Prin eliminarea pierderilor ascunse de apă/căldură (OCR contoare), renegocierea contractelor de mentenanță peste prețul pieței (Contract Leakage) și reducerea cu 80% a timpului de emitere a listelor de plată.'
                : lang === 'fa'
                ? 'از طریق کشف نشتی‌های مخفی انشعابات (قرائت تصویری کنتورها)، بازنگری قراردادهای مازاد نگهداری و آسانسور و کاهش ۸۰ درصدی زمان صدور فیش‌های ماهانه.'
                : 'Through automated riser leakage detection (OCR meters), peer-benchmarked vendor renegotiation (Contract Leakage alerts), and automated month-end billing.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
