'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Database, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, RefreshCw, FileSpreadsheet } from 'lucide-react';

interface ShadowLedgerDemoProps {
  lang: Language;
}

export const ShadowLedgerDemo: React.FC<ShadowLedgerDemoProps> = ({ lang }) => {
  const [resolved, setResolved] = useState<boolean>(false);

  const discrepancies = [
    {
      id: 'DISC-01',
      unit: 'Ap. 12',
      legacySum: '1,420.00 RON',
      legacyNote: lang === 'ro' ? 'Sold restanță Excel nespecificat' : 'Unspecified Excel balance',
      shadowSum: '1,385.40 RON',
      shadowFinding: lang === 'ro' ? 'Penalitate 0.2%/zi calculată eronat după scadență' : 'Penalty cap 0.2%/day miscalculated',
      difference: '-34.60 RON',
      status: resolved ? 'RESOLVED' : 'DISCREPANCY',
    },
    {
      id: 'DISC-02',
      unit: 'Ap. 45',
      legacySum: '210.00 RON',
      legacyNote: lang === 'ro' ? 'Index contor apă estimat din oficiu' : 'Estimated water meter index',
      shadowSum: '165.00 RON',
      shadowFinding: lang === 'ro' ? 'OCR foto contor a corectat citirea cu 3 m³' : 'AI Photo OCR corrected 3 m³ over-estimate',
      difference: '-45.00 RON',
      status: resolved ? 'RESOLVED' : 'DISCREPANCY',
    },
    {
      id: 'DISC-03',
      unit: 'Ap. 88',
      legacySum: '850.00 RON',
      legacyNote: lang === 'ro' ? 'Fond reparații inclus la chiriaș' : 'Reserve fund billed to tenant',
      shadowSum: '850.00 RON',
      shadowFinding: lang === 'ro' ? 'Re-alocat: 400 RON proprietar, 450 RON chiriaș' : 'Split: 400 RON owner, 450 RON tenant',
      difference: '0.00 RON (Split)',
      status: resolved ? 'RESOLVED' : 'DISCREPANCY',
    },
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-brand-500/20 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-brand-400" />
            <span>{lang === 'ro' ? 'Simulare Protocol Shadow Ledger (Core C16)' : 'Shadow Ledger Migration Simulator (Core C16)'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            {lang === 'ro' ? 'Reconcilierea Discrepanțelor din Softurile Vechi' : 'Auto-Reconciliation of Legacy System Discrepancies'}
          </h3>
        </div>

        <button
          onClick={() => setResolved(!resolved)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resolved
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-glow-emerald'
              : 'bg-gradient-to-r from-brand-500 to-emerald-500 hover:from-brand-600 hover:to-emerald-600 text-white shadow-glow-cyan'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resolved ? '' : 'animate-spin'}`} />
          <span className="text-white font-bold">{resolved ? (lang === 'ro' ? 'Reconciliat (Zero Erori)' : 'Reconciled (Zero Errors)') : (lang === 'ro' ? 'Rezolvă Discrepanțele' : 'Auto-Reconcile')}</span>
        </button>
      </div>

      {/* Discrepancy List */}
      <div className="mt-6 space-y-3">
        {discrepancies.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              resolved
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-surface-100/80 border-amber-500/30'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-white/10">
                    {item.unit}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {item.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      resolved
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {resolved ? (lang === 'ro' ? 'CORECTAT ÎN GL' : 'AUDITED & BALANCED') : (lang === 'ro' ? 'DISCREPANȚĂ DETECTATĂ' : 'DISCREPANCY')}
                  </span>
                </div>

                <div className="text-xs text-slate-200 pt-1">
                  <span className="text-slate-300">{lang === 'ro' ? 'Stare veche: ' : 'Legacy state: '}</span>
                  <span className="text-slate-100">{item.legacyNote} ({item.legacySum})</span>
                </div>

                <div className="text-xs text-emerald-300 font-medium">
                  <span>{lang === 'ro' ? 'Descoperire CLADORA: ' : 'CLADORA Finding: '}</span>
                  <span className="text-slate-100">{item.shadowFinding}</span>
                </div>
              </div>

              {/* Numbers */}
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-bold text-white">
                  {resolved ? item.shadowSum : item.legacySum}
                </div>
                <div className={`text-xs font-mono font-semibold ${resolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {resolved ? (lang === 'ro' ? 'Reconciliat' : 'Zero Variance') : `Diferență: ${item.difference}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-surface-200/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lang === 'ro' ? 'Rulăm în paralel 1-3 luni fără risc pentru asociație.' : 'Parallel run for 1-3 billing cycles with zero association risk.'}</span>
        </div>
        <span className="font-mono text-emerald-300 font-semibold">{lang === 'ro' ? 'Risc de migrare: 0%' : 'Migration Risk: 0%'}</span>
      </div>
    </div>
  );
};
