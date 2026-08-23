'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { 
  Vote, 
  Users, 
  FileCheck2, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function GovernancePage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const [userVote, setUserVote] = useState<'FOR' | 'AGAINST' | 'ABSTAIN' | null>('FOR');

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C12 — Governance & Statutory Voting
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Adunare Generală & Vot Statutar' : 'Governance & AGM Voting'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Convocare ședințe, calcul cvorum legal și decizii convertite automat în sarcini contabile
          </p>
        </div>
      </div>

      {/* Active Meeting Card */}
      <div className="card-proptech p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">
                SESIUNE DE VOT DESCHISĂ
              </span>
              <span className="text-xs text-[#7B8A9A]">Adunarea Generală Ordinară 2026</span>
            </div>
            <h2 className="text-lg font-bold text-[#102A43] mt-1">
              Proiect Modernizare Fațadă & Izolație Termică Subsol
            </h2>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-[#102A43]">Cvorum Întrunit: 68.5%</div>
            <div className="text-[#059669] font-medium">✓ Depășește pragul de 50%+1</div>
          </div>
        </div>

        {/* Voting UI */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-[#102A43]">
            Punctul 1 de pe ordinea de zi: Aprobare deviz estimativ 50.000 RON și eșalonare pe 6 luni
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setUserVote('FOR')}
              className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                userVote === 'FOR'
                  ? 'bg-[#ECFDF5] border-[#10B981] text-[#059669] ring-2 ring-[#10B981]'
                  : 'bg-white border-[#E2E8F0] text-[#52667A]'
              }`}
            >
              <span>👍 VOTEAZĂ PENTRU</span>
            </button>

            <button
              type="button"
              onClick={() => setUserVote('AGAINST')}
              className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                userVote === 'AGAINST'
                  ? 'bg-[#FEE2E2] border-[#E5484D] text-[#E5484D] ring-2 ring-[#E5484D]'
                  : 'bg-white border-[#E2E8F0] text-[#52667A]'
              }`}
            >
              <span>👎 ÎMPOTRIVĂ</span>
            </button>

            <button
              type="button"
              onClick={() => setUserVote('ABSTAIN')}
              className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                userVote === 'ABSTAIN'
                  ? 'bg-[#FFF7E6] border-[#F59E0B] text-[#B45309] ring-2 ring-[#F59E0B]'
                  : 'bg-white border-[#E2E8F0] text-[#52667A]'
              }`}
            >
              <span>ABȚINERE</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F9FC] text-xs text-[#52667A] flex items-center justify-between">
            <span>Votul tău este înregistrat cu succes pentru <strong>Ap. 14 (CPI: 1.25%)</strong></span>
            <span className="font-mono text-[#0A6E62] font-bold">Hash: #VOT-8821A</span>
          </div>
        </div>

      </div>

    </div>
  );
}
