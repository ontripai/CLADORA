'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { FileCheck, ShieldAlert, CheckCircle, ArrowRight, RefreshCw, Layers } from 'lucide-react';

interface ShadowLedgerDemoProps {
  lang: Language;
}

export const ShadowLedgerDemo: React.FC<ShadowLedgerDemoProps> = ({ lang }) => {
  const [activeStep, setActiveStep] = useState<number>(2);
  const [reconciled, setReconciled] = useState<boolean>(false);

  const sampleUnits = [
    { unit: 'Ap. 01 (Popa M.)', legacyBalance: '340.50 RON', cladoraBalance: '340.50 RON', diff: '0.00 RON', status: 'MATCHED' },
    { unit: 'Ap. 02 (Stanciu V.)', legacyBalance: '512.00 RON', cladoraBalance: '512.00 RON', diff: '0.00 RON', status: 'MATCHED' },
    { unit: 'Ap. 03 (Ionescu G.)', legacyBalance: '1,280.00 RON', cladoraBalance: reconciled ? '1,280.00 RON' : '1,245.00 RON', diff: reconciled ? '0.00 RON' : '-35.00 RON (Penalitate neluată în calcul)', status: reconciled ? 'RESOLVED' : 'DISCREPANCY' },
    { unit: 'Ap. 04 (Vasilescu A.)', legacyBalance: '0.00 RON', cladoraBalance: '0.00 RON', diff: '0.00 RON', status: 'MATCHED' },
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-brand-500/20 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>{lang === 'ro' ? 'Simulator Motor Shadow Ledger (Core C16)' : 'Shadow Ledger Migration Engine Demo (Core C16)'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            {lang === 'ro' ? 'Cum eliminăm riscul erorilor la migrare' : 'Zero-Discrepancy Migration Simulator'}
          </h3>
        </div>

        <button
          onClick={() => setReconciled(!reconciled)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            reconciled
              ? 'bg-emerald-500 text-white shadow-glow-emerald'
              : 'bg-brand-500 text-white shadow-glow-cyan'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reconciled ? '' : 'animate-spin'}`} />
          <span>{reconciled ? (lang === 'ro' ? 'Reconciliere Reușită (100%)' : 'Fully Reconciled') : (lang === 'ro' ? 'Rezolvă Discrepanța' : 'Resolve Discrepancy')}</span>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-4 gap-2 my-6 text-center text-xs">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
          1. Import Staging
        </div>
        <div className="p-2 rounded-lg bg-brand-500/15 border border-brand-500/40 text-brand-300 font-semibold">
          2. Auto-Reconcile
        </div>
        <div className={`p-2 rounded-lg border font-semibold ${reconciled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-surface-200/50 border-white/5 text-slate-400'}`}>
          3. Shadow Period
        </div>
        <div className={`p-2 rounded-lg border font-semibold ${reconciled ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-surface-200/50 border-white/5 text-slate-400'}`}>
          4. Safe Cutover
        </div>
      </div>

      {/* Live Table */}
      <div className="rounded-2xl bg-surface-100/80 border border-white/10 overflow-hidden text-xs">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-surface-200/50 text-slate-400">
            <tr>
              <th className="p-3">Apartament / Proprietar</th>
              <th className="p-3">Sold Soft Vechi (Xisoft/Excel)</th>
              <th className="p-3">Sold Calculat CLADORA</th>
              <th className="p-3">Diferență / Notă</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200 font-mono">
            {sampleUnits.map((u, i) => (
              <tr key={i} className={u.status === 'DISCREPANCY' ? 'bg-red-500/10' : ''}>
                <td className="p-3 font-sans font-medium text-white">{u.unit}</td>
                <td className="p-3">{u.legacyBalance}</td>
                <td className="p-3 font-bold text-brand-300">{u.cladoraBalance}</td>
                <td className="p-3">
                  <span className={u.status === 'DISCREPANCY' ? 'text-red-400 font-sans' : 'text-emerald-400'}>
                    {u.diff}
                  </span>
                </td>
                <td className="p-3 font-sans font-bold">
                  {u.status === 'MATCHED' && <span className="text-emerald-400">✓ Validat</span>}
                  {u.status === 'RESOLVED' && <span className="text-emerald-400">✓ Ajustat cu Justificare</span>}
                  {u.status === 'DISCREPANCY' && <span className="text-red-400">⚠️ Necesită Verificare</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-surface-100 border border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ro' ? 'Protocolul Shadow Ledger garantează zero pierderi de istoric la trecerea pe CLADORA.' : 'Shadow Ledger protocol guarantees zero financial history loss.'}</span>
        </div>
        <span className="font-mono text-emerald-400 font-bold">
          {reconciled ? 'Variance: 0.00 RON (OK)' : 'Variance: 35.00 RON (Exception #EX-904)'}
        </span>
      </div>
    </div>
  );
};
