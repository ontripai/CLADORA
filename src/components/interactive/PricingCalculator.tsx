'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface PricingCalculatorProps {
  lang: Language;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const [isYearly, setIsYearly] = useState<boolean>(true);
  const [units, setUnits] = useState<number>(60);
  const [includeIntelligence, setIncludeIntelligence] = useState<boolean>(true);

  const discountMultiplier = isYearly ? 0.8 : 1.0;
  const isRo = lang === 'ro';
  const currency = isRo ? 'RON' : 'EUR';

  return (
    <div className="space-y-12">
      {/* Top Toggle Row & Units Slider */}
      <div className="p-6 rounded-3xl glass-panel border border-white/15 max-w-3xl mx-auto space-y-6">
        
        {/* Monthly vs Yearly Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-semibold ${!isYearly ? 'text-white' : 'text-slate-300'}`}>
            {dict.pricing.monthly}
          </span>
          <button
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-14 h-7 rounded-full bg-surface-200 border border-white/20 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
            aria-label={lang === 'ro' ? 'Comută între facturare lunară și anuală' : 'Toggle between monthly and annual billing'}
          >
            <div
              className={`w-5 h-5 rounded-full bg-gradient-to-r from-brand-400 to-emerald-400 shadow-md transform transition-transform ${
                isYearly ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${isYearly ? 'text-white' : 'text-slate-300'}`}>
              {dict.pricing.yearly}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              -20%
            </span>
          </div>
        </div>

        {/* Units Slider */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center">
            <label htmlFor="pricingUnitsRangeInput" className="text-xs font-semibold text-slate-200">
              {dict.pricing.unitsLabel}
            </label>
            <span className="text-base font-mono font-bold text-brand-300">
              {units} {isRo ? 'apartamente / proprietăți' : 'units / properties'}
            </span>
          </div>
          <input
            id="pricingUnitsRangeInput"
            name="pricingUnitsRangeInput"
            aria-label={lang === 'ro' ? 'Număr apartamente pentru calcul tarif' : 'Number of units for pricing calculation'}
            type="range"
            min="10"
            max="250"
            step="5"
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
            className="w-full accent-brand-400 cursor-pointer"
          />
        </div>

        {/* Addon checkbox */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="intelAddon"
            name="intelAddon"
            aria-label={isRo ? 'Include modulul Cladora Intelligence' : 'Include Cladora Intelligence module'}
            checked={includeIntelligence}
            onChange={(e) => setIncludeIntelligence(e.target.checked)}
            className="w-4 h-4 rounded bg-surface-200 border-white/20 text-brand-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="intelAddon" className="text-xs text-slate-200 font-medium cursor-pointer">
            ✨ {isRo ? 'Include modulul Cladora Intelligence & Economii Verificate (+0.50 RON/unitate)' : 'Include Cladora Intelligence & Verified Savings (+0.10 EUR/unit)'}
          </label>
        </div>

      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {dict.pricing.plans.map((plan) => {
          const isFeatured = plan.id === 'association';
          const basePrice = plan.basePriceMonthly * discountMultiplier;
          const unitRate = plan.perUnitMonthly * discountMultiplier;
          const addonRate = includeIntelligence ? (isRo ? 0.5 : 0.1) * discountMultiplier : 0;
          const totalMonthly = basePrice + (units * (unitRate + addonRate));

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                isFeatured
                  ? 'glass-panel border-brand-500/50 shadow-2xl glow-box-cyan lg:-translate-y-2'
                  : 'glass-panel border-white/10 hover:border-white/20'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 text-white text-[11px] font-bold tracking-wider uppercase shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {plan.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div className="p-4 rounded-2xl bg-surface-100/70 border border-white/5 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                      {Math.round(totalMonthly)}
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {currency} / {isRo ? 'lună' : 'month'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    {isRo 
                      ? `Echivalent ~${(totalMonthly / units).toFixed(2)} RON / apartament`
                      : `~${(totalMonthly / units).toFixed(2)} EUR / unit`}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
                    {isRo ? 'Ce include pachetul:' : 'Included capabilities:'}
                  </span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-8 mt-4 border-t border-white/5">
                <Link
                  href={`/${lang}/pilot`}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold transition-all ${
                    isFeatured
                      ? 'bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-white shadow-glow-cyan'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  <span>{plan.ctaLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
