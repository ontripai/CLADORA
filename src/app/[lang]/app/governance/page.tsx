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
import { Money } from '@/components/ui/Money';

export default function GovernancePage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const [userVote, setUserVote] = useState<'FOR' | 'AGAINST' | 'ABSTAIN' | null>('FOR');

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C12 — Guvernanță & Vot Statutar' 
              : lang === 'fa' 
              ? 'هسته C12 — مجمع عمومی و رأی‌گیری رسمی با حد نصاب قانونی' 
              : 'Core C12 — Governance & Statutory Voting'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Adunare Generală & Vot Statutar' : lang === 'fa' ? 'مجمع عمومی و سامانه رأی‌گیری آنلاین' : 'Governance & AGM Voting'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Convocare ședințe, calcul cvorum legal și decizii convertite automat în sarcini contabile' 
              : lang === 'fa' 
              ? 'دعوت به جلسه، محاسبه خودکار حد نصاب قانونی و تبدیل مصوبات به تکالیف حسابداری' 
              : 'Statutory hybrid AGM with automated quorum calculation and ledger execution'}
          </p>
        </div>
      </div>

      {/* Active Meeting Card */}
      <div className="card-proptech p-6 sm:p-8 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669]">
                {lang === 'ro' ? 'SESIUNE DE VOT DESCHISĂ' : lang === 'fa' ? 'رأی‌گیری فعال و باز' : 'ACTIVE VOTING SESSION'}
              </span>
              <span className="text-xs text-[#7B8A9A]">
                {lang === 'ro' ? 'Adunarea Generală Ordinară 2026' : lang === 'fa' ? 'مجمع عمومی عادی سالانه ۲۰۲۶' : 'Annual General Meeting 2026'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#102A43] mt-1">
              {lang === 'ro' 
                ? 'Proiect Modernizare Fațadă & Izolație Termică Subsol' 
                : lang === 'fa' 
                ? 'پروژه نوسازی عایق حرارتی موتورخانه و بازسازی نمای ورودی' 
                : 'Thermal Insulation & Modernization Capital Project'}
            </h2>
          </div>
          <div className="text-end text-xs">
            <div className="font-bold text-[#102A43]">
              {lang === 'ro' ? 'Cvorum Întrunit: 68.5%' : lang === 'fa' ? 'حد نصاب حاصل‌شده: ۶۸.۵٪' : 'Quorum Reached: 68.5%'}
            </div>
            <div className="text-[#059669] font-medium">
              {lang === 'ro' ? '✓ Depășește pragul de 50%+1' : lang === 'fa' ? '✓ حد نصاب قانونی احراز شد' : '✓ Exceeds 50%+1 statutory threshold'}
            </div>
          </div>
        </div>

        {/* Voting UI */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-[#102A43]">
            {lang === 'ro' ? (
              <>Punctul 1 de pe ordinea de zi: Aprobare deviz estimativ <Money amount={50000} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} /> și eșalonare pe 6 luni</>
            ) : lang === 'fa' ? (
              <>دستور اول جلسه: تصویب برآورد هزینه اجرایی به مبلغ <Money amount={50000} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} /> و تقسیط در ۶ ماه</>
            ) : (
              <>Agenda Item 1: Approval of estimated budget <Money amount={50000} currency="RON" locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} /> over 6 months</>
            )}
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
              <span>{lang === 'ro' ? '👍 VOTEAZĂ PENTRU' : lang === 'fa' ? '👍 موافق (رأی مثبت)' : '👍 VOTE FOR'}</span>
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
              <span>{lang === 'ro' ? '👎 ÎMPOTRIVĂ' : lang === 'fa' ? '👎 مخالف (رأی منفی)' : '👎 AGAINST'}</span>
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
              <span>{lang === 'ro' ? 'ABȚINERE' : lang === 'fa' ? 'ممتنع' : 'ABSTAIN'}</span>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-[#F6F9FC] text-xs text-[#52667A] flex items-center justify-between">
            <span>
              {lang === 'ro' 
                ? 'Votul tău este semnat criptografic cu ponderea CPI a apartamentului tău (1.25%).' 
                : lang === 'fa' 
                ? 'رأی شما با وزن سهم مشاع آپارتمان (۱٫۲۵٪) به‌صورت دیجیتال ثبت و قفل می‌شود.' 
                : 'Your vote is signed with your unit’s statutory CPI share (1.25%).'}
            </span>
            <span className="font-mono text-[#059669] font-bold">
              {lang === 'ro' ? 'Vot Înregistrat' : lang === 'fa' ? 'رأی ثبت شد' : 'Vote Logged'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
