'use client';

import React from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Scale, Check, X, Sparkles, HelpCircle } from 'lucide-react';

interface CompetitorComparisonTableProps {
  lang: Language;
}

export const CompetitorComparisonTable: React.FC<CompetitorComparisonTableProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const comparison = dict.comparison;

  return (
    <section className="py-24 relative bg-[#070B12] overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <Scale className="w-3.5 h-3.5" />
            <span>{comparison.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {comparison.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            {comparison.description}
          </p>
        </div>

        {/* Comparison Table Container */}
        <div className="mt-14 overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="rounded-3xl glass-panel border border-white/10 shadow-2xl overflow-hidden">
              <table className="min-w-full divide-y divide-white/10 text-left">
                
                {/* Table Header */}
                <thead>
                  <tr className="bg-surface-100/80">
                    <th scope="col" className="py-5 pl-6 pr-3 text-xs font-bold text-slate-300 uppercase tracking-wider w-1/4">
                      {comparison.headers.feature}
                    </th>
                    <th scope="col" className="px-4 py-5 text-xs font-extrabold text-brand-300 uppercase tracking-wider bg-brand-500/10 border-x border-brand-500/20 w-1/3">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-400" />
                        <span>{comparison.headers.cladora}</span>
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {comparison.headers.legacyDesktop}
                    </th>
                    <th scope="col" className="px-4 py-5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {comparison.headers.basicPortal}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-white/5 bg-surface-50/40 text-xs sm:text-sm">
                  {comparison.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      {/* Feature Name */}
                      <td className="py-4 pl-6 pr-3 font-semibold text-white">
                        {row.feature}
                      </td>

                      {/* CLADORA (Highlighted) */}
                      <td className="px-4 py-4 font-semibold text-brand-200 bg-brand-500/5 border-x border-brand-500/10">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>{row.cladora}</span>
                        </div>
                      </td>

                      {/* Legacy Desktop */}
                      <td className="px-4 py-4 text-slate-400">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400/70 font-bold shrink-0 mt-0.5">✕</span>
                          <span>{row.legacyDesktop}</span>
                        </div>
                      </td>

                      {/* Basic Portal */}
                      <td className="px-4 py-4 text-slate-400">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-400/70 font-bold shrink-0 mt-0.5">!</span>
                          <span>{row.basicPortal}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        </div>

        {/* Trust Footnote */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {lang === 'ro' 
            ? '* Comparație bazată pe specificațiile tehnice publice și standardele contabile din Legea 196/2018.'
            : '* Comparison based on publicly documented architectures and statutory accounting requirements.'}
        </div>

      </div>
    </section>
  );
};
