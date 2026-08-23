'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { ShadowLedgerDemo } from '@/components/interactive/ShadowLedgerDemo';

interface MigrationSectionProps {
  lang: Language;
}

export const ShadowLedgerMigrationSection: React.FC<MigrationSectionProps> = ({ lang }) => {
  const steps = [
    {
      num: '01',
      title: lang === 'ro' ? 'Import Date Vechi' : 'Legacy Data Import',
      desc: lang === 'ro' ? 'Preluare baze de date din BlocManager, Xisoft, Aviziero, Platformis sau fișiere Excel.' : 'Ingest raw data exports from legacy software (BlocManager, Xisoft, Excel tables).'
    },
    {
      num: '02',
      title: lang === 'ro' ? 'Reconciliere Automată' : 'Variance Detection',
      desc: lang === 'ro' ? 'Motorul Shadow Ledger identifică restanțe calculate eronat, fonduri amestecate și erori de penalitate.' : 'Shadow Ledger algorithms audit historical balances, penalty caps, and fund splits.'
    },
    {
      num: '03',
      title: lang === 'ro' ? 'Rulare în Paralel' : 'Parallel Dual Run',
      desc: lang === 'ro' ? 'Rulăm 1–3 luni în paralel cu softul existent până când comitetul și cenzorul au încredere 100%.' : 'Operate 1–3 billing cycles concurrently until committee and auditors verify 100% accuracy.'
    },
    {
      num: '04',
      title: lang === 'ro' ? 'Comutare Controlată' : 'Controlled Cutover',
      desc: lang === 'ro' ? 'Trecerea definitivă pe CLADORA fără oprirea activității și fără pierderi de istoric contabil.' : 'Clean transition to production ledger with complete zero-data-loss audit history.'
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C16 — Shadow Ledger' : 'C16 Core — Shadow Ledger'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' ? 'Migrare Fără Risc pentru Asociație' : 'Safe Parallel Migration for Associations'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Schimbarea programului de administrare este adesea blocată de frica de a strica soldurile. Protocolul Shadow Ledger a fost proiectat special pentru a elimina orice risc operațional.'
              : 'Switching property software usually stalls over fear of corrupting accounting balances. Shadow Ledger protocol runs side-by-side to discover errors before cutover.'}
          </p>
        </div>

        {/* 4 Steps Horizontal Sequence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {steps.map((step, idx) => (
            <div key={idx} className="card-proptech p-6 relative flex flex-col justify-between">
              <div>
                <div className="text-2xl font-display font-extrabold text-[#0E9F8E] font-mono">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-[#102A43] mt-3">
                  {step.title}
                </h3>
                <p className="text-xs text-[#52667A] mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Live Interactive Shadow Ledger Simulator */}
        <div className="mt-14">
          <ShadowLedgerDemo lang={lang} />
        </div>

      </div>
    </section>
  );
};
