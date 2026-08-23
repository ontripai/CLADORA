'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Check, ArrowRight } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { formatMoney, formatNumber } from '@/config/currencies';

interface PricingCalculatorProps {
  lang: Language;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const [isYearly, setIsYearly] = useState<boolean>(true);
  const [units, setUnits] = useState<number>(60);
  const [includeIntelligence, setIncludeIntelligence] = useState<boolean>(true);

  const discountMultiplier = isYearly ? 0.8 : 1.0;
  const currency = 'RON';

  return (
    <div className="space-y-12">
      {/* Top Toggle Row & Units Slider */}
      <div className="p-6 rounded-3xl bg-white border border-[#D3DCE6] shadow-card max-w-3xl mx-auto space-y-6">
        
        {/* Monthly vs Yearly Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-bold ${!isYearly ? 'text-[#102A43]' : 'text-[#52667A]'}`}>
            {dict.pricing.monthly}
          </span>
          <button
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 rounded-full bg-[#E2E8F0] border border-[#D3DCE6] p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
            aria-label={lang === 'ro' ? 'Comută între facturare lunară și anuală' : lang === 'fa' ? 'تغییر وضعیت پرداخت ماهانه یا سالانه' : 'Toggle between monthly and annual billing'}
          >
            <div
              className={`w-5 h-5 rounded-full bg-[#087A6E] shadow-md transform transition-transform ${
                isYearly ? 'translate-x-7 rtl:-translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isYearly ? 'text-[#102A43]' : 'text-[#52667A]'}`}>
              {dict.pricing.yearly}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              -20%
            </span>
          </div>
        </div>

        {/* Units Slider */}
        <div className="space-y-2 pt-2 border-t border-[#F0F4F8]">
          <div className="flex justify-between items-center">
            <label htmlFor="pricingUnitsRangeInput" className="text-xs font-bold text-[#102A43]">
              {dict.pricing.unitsLabel}
            </label>
            <span className="text-base font-mono font-bold text-[#0A6E62]">
              {formatNumber(units, lang)} {lang === 'ro' ? 'apartamente / proprietăți' : lang === 'fa' ? 'واحد مسکونی / ملک' : 'units / properties'}
            </span>
          </div>
          <input
            id="pricingUnitsRangeInput"
            name="pricingUnitsRangeInput"
            aria-label={lang === 'ro' ? 'Număr apartamente pentru calcul tarif' : lang === 'fa' ? 'تعداد واحدها برای محاسبه تعرفه' : 'Number of units for pricing calculation'}
            type="range"
            min="10"
            max="250"
            step="5"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full accent-[#0E9F8E] cursor-pointer"
          />
        </div>

        {/* Addon checkbox */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="intelAddon"
            name="intelAddon"
            aria-label={lang === 'ro' ? 'Include modulul Cladora Intelligence' : lang === 'fa' ? 'افزودن ماژول هوش مصنوعی کلادورا' : 'Include Cladora Intelligence module'}
            checked={includeIntelligence}
            onChange={(e) => setIncludeIntelligence(e.target.checked)}
            className="w-4 h-4 rounded bg-white border-[#D3DCE6] text-[#0E9F8E] focus:ring-0 cursor-pointer"
          />
          <label htmlFor="intelAddon" className="text-xs text-[#52667A] font-medium cursor-pointer">
            ✨ {lang === 'ro' 
              ? 'Include modulul Cladora Intelligence & Economii Verificate (+0.50 RON/unitate)' 
              : lang === 'fa'
              ? 'افزودن هوش مصنوعی کلادورا و پایش خودکار صرفه‌جویی (+۰٫۵۰ RON به ازای هر واحد)'
              : 'Include Cladora Intelligence & Verified Savings (+0.50 RON/unit)'}
          </label>
        </div>

      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {dict.pricing.plans.map((plan) => {
          const isFeatured = plan.id === 'association';
          const basePrice = plan.basePriceMonthly * discountMultiplier;
          const unitRate = plan.perUnitMonthly * discountMultiplier;
          const addonRate = includeIntelligence ? 0.5 * discountMultiplier : 0;
          const totalMonthly = basePrice + (units * (unitRate + addonRate));
          const perUnitRate = totalMonthly / units;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                isFeatured
                  ? 'bg-white border-2 border-[#087A6E] shadow-elevated lg:-translate-y-2'
                  : 'bg-white border border-[#E2E8F0] shadow-card hover:border-[#B2E5DF]'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#087A6E] text-white text-[11px] font-bold tracking-wider uppercase shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-[#102A43]">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-[#52667A] mt-1">
                    {plan.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-[#F6F9FC] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43]">
                      <Money amount={Math.round(totalMonthly)} currency={currency} locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
                    </span>
                    <span className="text-xs font-mono text-[#52667A] font-bold">
                      / {lang === 'ro' ? 'lună' : lang === 'fa' ? 'ماه' : 'month'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#047857] font-bold font-mono">
                    {lang === 'ro' 
                      ? `Echivalent ~${formatMoney(perUnitRate, currency, lang)} / apartament`
                      : lang === 'fa'
                      ? `معادل ~${formatMoney(perUnitRate, currency, lang)} به ازای هر واحد`
                      : `~${formatMoney(perUnitRate, currency, lang)} / unit`}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-[#52667A] uppercase tracking-wider block">
                    {lang === 'ro' ? 'Ce include pachetul:' : lang === 'fa' ? 'امکانات این بسته:' : 'Included capabilities:'}
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-[#52667A]">
                      <Check className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-8 mt-4 border-t border-[#F0F4F8]">
                <Link
                  href={`/${lang}/pilot`}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    isFeatured
                      ? 'bg-[#087A6E] hover:bg-[#066056] text-white shadow-sm'
                      : 'bg-[#102A43] hover:bg-[#173F5F] text-white shadow-sm'
                  }`}
                >
                  <span>{plan.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
