'use client';

import React from 'react';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { Check, X, Sparkles, Shield, AlertTriangle } from 'lucide-react';

interface CompetitorComparisonTableProps {
  lang: Language;
}

export const CompetitorComparisonTable: React.FC<CompetitorComparisonTableProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const comparison = dict.comparison;

  return (
    <section className="py-24 relative bg-[#070B12] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-brand-500/20 text-xs font-semibold text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>{comparison.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
            {comparison.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            {comparison.description}
          </p>
        </div>

        {/* Responsive Table Container */}
        <div className="mt-14 overflow-x-auto pb-6">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-white/15">
                <th scope="col" className="py-4 px-4 text-xs font-semibold text-slate-200 uppercase tracking-wider w-1/3">
                  {comparison.headers?.feature || (lang === 'ro' ? 'Capabilitate & Standard' : 'Capability & Standard')}
                </th>
                <th scope="col" className="py-4 px-4 text-xs font-bold text-brand-300 uppercase tracking-wider bg-brand-500/15 rounded-t-xl border-x border-t border-brand-500/30 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span>{comparison.headers?.cladora || 'CLADORA Platform'}</span>
                  </div>
                </th>
                <th scope="col" className="py-4 px-4 text-xs font-semibold text-slate-200 uppercase tracking-wider text-center">
                  {comparison.headers?.legacyDesktop || (lang === 'ro' ? 'Softuri Clasice Desktop' : 'Legacy Desktop Software')}
                </th>
                <th scope="col" className="py-4 px-4 text-xs font-semibold text-slate-200 uppercase tracking-wider text-center">
                  {comparison.headers?.basicPortal || (lang === 'ro' ? 'Portaluri Web Simple' : 'Basic Web Portals')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {comparison.rows.map((row, index) => {
                const legacyText = (row as any).legacyDesktop || (row as any).legacy || '';
                const basicText = (row as any).basicPortal || (row as any).basicPortals || '';

                return (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                    {/* Feature description */}
                    <td className="py-4 px-4 font-medium text-slate-100">
                      <div className="flex flex-col">
                        <span>{row.feature}</span>
                      </div>
                    </td>

                    {/* CLADORA (Highlighted) */}
                    <td className="py-4 px-4 bg-brand-500/10 border-x border-brand-500/30 text-center font-semibold text-white">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs text-emerald-300 font-bold">{row.cladora}</span>
                      </div>
                    </td>

                    {/* Legacy desktop soft */}
                    <td className="py-4 px-4 text-center text-slate-300 text-xs">
                      {legacyText.includes('Nu') || legacyText.includes('No') ? (
                        <div className="flex items-center justify-center gap-1.5 text-rose-400">
                          <X className="w-3.5 h-3.5" />
                          <span>{legacyText}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">{legacyText}</span>
                      )}
                    </td>

                    {/* Basic portals */}
                    <td className="py-4 px-4 text-center text-slate-300 text-xs">
                      {basicText.includes('Nu') || basicText.includes('No') ? (
                        <div className="flex items-center justify-center gap-1.5 text-rose-400">
                          <X className="w-3.5 h-3.5" />
                          <span>{basicText}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">{basicText}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <div className="mt-6 text-center text-xs text-slate-300">
          * {lang === 'ro' 
              ? 'Comparație bazată pe specificațiile tehnice publice și standardele contabile impuse de Legea 196/2018.'
              : 'Comparison based on publicly available specifications and Romanian Law 196/2018 compliance benchmarks.'}
        </div>

      </div>
    </section>
  );
};
