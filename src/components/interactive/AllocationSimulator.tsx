'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Scale, Info, User, Home } from 'lucide-react';

interface AllocationSimulatorProps {
  lang: Language;
}

export const AllocationSimulator: React.FC<AllocationSimulatorProps> = ({ lang }) => {
  const [expenseType, setExpenseType] = useState<'consumption' | 'repairFund' | 'brokenPipe' | 'capitalUpgrade'>('consumption');
  const [amount, setAmount] = useState<number>(450);

  const scenarios = {
    consumption: {
      name: lang === 'ro' ? 'Consum Apă Caldă & Menajeră' : lang === 'fa' ? 'مصرف آب گرم و انشعابات' : 'Water & Utility Consumption',
      legalDebtor: lang === 'ro' ? 'Proprietar (Ap. 14)' : lang === 'fa' ? 'مالک (واحد ۱۴)' : 'Owner (Unit 14)',
      operationalPayer: lang === 'ro' ? 'Chiriaș (Alex Popescu)' : lang === 'fa' ? 'مستأجر (علی حسینی)' : 'Tenant (Alex Popescu)',
      beneficiary: lang === 'ro' ? 'Locatar curent' : lang === 'fa' ? 'ساکن فعلی' : 'Current Occupant',
      reimbursement: lang === 'ro' ? 'Achitat direct de chiriaș prin aplicație' : lang === 'fa' ? 'پرداخت مستقیم توسط مستأجر در اپلیکیشن' : 'Paid directly by tenant via app',
      explanation: lang === 'ro'
        ? 'Conform Legii 196/2018 și contractului de închiriere, consumurile curente sunt suportate operațional de cel care locuiește, dar asociația are ca garant legal proprietarul.'
        : lang === 'fa'
        ? 'بر اساس الزامات قانونی و قرارداد اجاره، مصارف جاری بر عهده ساکن فعلی است، در حالی که انجمن مالکان همواره مالک را ضامن قانونی وصول می‌شناسد.'
        : 'Under Law 196/2018 and the lease agreement, operational consumption is billed directly to the active tenant while keeping the owner as statutory guarantor.',
      split: { owner: 0, tenant: amount },
    },
    repairFund: {
      name: lang === 'ro' ? 'Cotă Fond de Reparații (Reparație Acoperiș)' : lang === 'fa' ? 'سهم صندوق تعمیرات اساسی (ایزوگام بام)' : 'Capital Repair Fund (Roof Repair)',
      legalDebtor: lang === 'ro' ? 'Proprietar (Ap. 14)' : lang === 'fa' ? 'مالک (واحد ۱۴)' : 'Owner (Unit 14)',
      operationalPayer: lang === 'ro' ? 'Proprietar (Radu Ionescu)' : lang === 'fa' ? 'مالک (رضا تهرانی)' : 'Owner (Radu Ionescu)',
      beneficiary: lang === 'ro' ? 'Valoarea Patrimonială a Imobilului' : lang === 'fa' ? 'ارزش سرمایه‌ای و عرصه ملک' : 'Asset Capital Value',
      reimbursement: lang === 'ro' ? 'Nu se transferă chiriașului (Interzis prin lege)' : lang === 'fa' ? 'غیرقابل انتقال به مستأجر (قانوناً بر عهده مالک)' : 'Non-transferable to tenant (Statutory rule)',
      explanation: lang === 'ro'
        ? 'Fondul de reparații și investițiile capitale cresc valoarea activului și sunt strict în sarcina proprietarului. CLADORA nu le include pe nota de plată a chiriașului.'
        : lang === 'fa'
        ? 'صندوق تعمیرات و بازسازی زیرساخت‌ها ارزش ملک را افزایش می‌دهد و منحصراً بر عهده مالک است. کلادورا مانع از درج ناخواسته این ارقام در فیش مستأجر می‌شود.'
        : 'Reserve fund quotas increase the long-term equity of the building and are strictly the owner’s liability. CLADORA prevents accidental billing to the tenant.',
      split: { owner: amount, tenant: 0 },
    },
    brokenPipe: {
      name: lang === 'ro' ? 'Daună Neglijență (Robinet Lăsat Deschis)' : lang === 'fa' ? 'خسارت سهل‌انگاری (سرریز آب و ترکیدگی)' : 'Occupant Negligence Damage',
      legalDebtor: lang === 'ro' ? 'Proprietar (Răspundere terț)' : lang === 'fa' ? 'مالک (مسئولیت قانونی)' : 'Owner (Third-party liability)',
      operationalPayer: lang === 'ro' ? 'Chiriaș (Responsabil de daună)' : lang === 'fa' ? 'مستأجر (عامل ایجاد خسارت)' : 'Tenant (At-fault party)',
      beneficiary: lang === 'ro' ? 'Vecin Afectat (Ap. 10)' : lang === 'fa' ? 'همسایه متضرر (واحد ۱۰)' : 'Affected Neighbor (Unit 10)',
      reimbursement: lang === 'ro' ? 'Reținut din Garanție / Facturat Chiriaș' : lang === 'fa' ? 'کسر از ودیعه / صورت‌حساب خسارت مستأجر' : 'Deducted from Security Deposit',
      explanation: lang === 'ro'
        ? 'CLADORA generează un dosar probatoriu cu data incidentului, permițând decontarea automată din depozitul de garanție al chiriașului fără litigii.'
        : lang === 'fa'
        ? 'کلادورا گزارش مستند و تغییرناپذیر حادثه را با زمان‌بندی دقیق ثبت می‌کند و امکان تسویه خودکار از محل ودیعه را بدون اختلاف حقوقی فراهم می‌سازد.'
        : 'CLADORA creates an immutable evidence log with timestamps, enabling automatic settlement against the security deposit.',
      split: { owner: 0, tenant: amount },
    },
    capitalUpgrade: {
      name: lang === 'ro' ? 'Modernizare Lift / Panouri Solare' : lang === 'fa' ? 'ارتقای مشاعات (تعویض موتور آسانسور / پنل خورشیدی)' : 'Modernization (Elevator / Solar Panels)',
      legalDebtor: lang === 'ro' ? 'Proprietar (Cotă-parte CPI)' : lang === 'fa' ? 'مالک (سهم مشاع CPI)' : 'Owner (Undivided share CPI)',
      operationalPayer: lang === 'ro' ? 'Proprietar (Fond Investiții)' : lang === 'fa' ? 'مالک (صندوق سرمایه‌گذاری)' : 'Owner (Investment Fund)',
      beneficiary: lang === 'ro' ? 'Comunitate & Eficiență Energetică' : lang === 'fa' ? 'بهره‌وری انرژی و ارزش کلی ساختمان' : 'Community & Energy Efficiency',
      reimbursement: lang === 'ro' ? 'Investiție Amortizabilă' : lang === 'fa' ? 'سرمایه‌گذاری استهلاک‌پذیر در ملک' : 'Capitalized Asset Investment',
      explanation: lang === 'ro'
        ? 'Calculat automat după Cota-Parte Indiviză (CPI) a apartamentului. Înregistrat în registrul de valoare a clădirii pentru creșterea prețului de vânzare/închiriere.'
        : lang === 'fa'
        ? 'محاسبه خودکار بر مبنای قدرالسهم مشاع آپارتمان. ثبت در شناسنامه فنی و ارزش دارایی جهت ارتقای قیمت فروش یا رهن و اجاره ملک.'
        : 'Automatically computed by the unit’s CPI share. Logged in the Building Value Ledger to increase market valuation.',
      split: { owner: amount, tenant: 0 },
    },
  };

  const current = scenarios[expenseType];

  return (
    <div id="simulator" className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D3DCE6] shadow-elevated relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0E9F8E] uppercase tracking-wider">
            <Scale className="w-4 h-4 text-[#0E9F8E]" />
            <span>
              {lang === 'ro' 
                ? 'Simulator Interactiv de Alocare (Core C02)' 
                : lang === 'fa'
                ? 'شبیه‌ساز تعاملی تفکیک حقوق و هزینه‌ها (هسته C02)'
                : 'Interactive 4-Way Rights Simulator (Core C02)'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' 
              ? 'Separarea Cheltuielilor: Proprietar vs. Chiriaș' 
              : lang === 'fa'
              ? 'تسهیم ۴ بعدی هزینه‌ها: سهم مالک در برابر مستأجر'
              : 'Owner vs. Tenant 4-Dimensional Expense Split'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="invoiceAmountInput" className="text-xs text-[#52667A] font-bold">
            {lang === 'ro' ? 'Sumă Factură:' : lang === 'fa' ? 'مبلغ فاکتور:' : 'Invoice Amount:'}
          </label>
          <input
            id="invoiceAmountInput"
            name="invoiceAmount"
            type="number"
            aria-label={lang === 'ro' ? 'Sumă factură în RON' : 'Invoice amount in RON'}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-28 px-3 py-1.5 rounded-lg bg-[#F6F9FC] border border-[#D3DCE6] text-[#102A43] font-mono text-sm font-bold text-right focus:border-[#0E9F8E] focus:outline-none"
          />
          <span className="text-xs font-mono text-[#52667A] font-bold">RON</span>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-6 pb-6">
        <button
          type="button"
          onClick={() => setExpenseType('consumption')}
          className={`p-3 rounded-xl text-start text-xs font-bold transition-all border ${
            expenseType === 'consumption'
              ? 'bg-[#EAF8F5] border-[#0E9F8E] text-[#0A6E62] shadow-sm ring-1 ring-[#0E9F8E]'
              : 'bg-[#F6F9FC] border-[#E2E8F0] text-[#52667A] hover:bg-white'
          }`}
        >
          🚰 {lang === 'ro' ? 'Consum Curent Utilități' : lang === 'fa' ? 'مصارف روزمره انشعابات' : 'Utility Consumption'}
        </button>

        <button
          type="button"
          onClick={() => setExpenseType('repairFund')}
          className={`p-3 rounded-xl text-start text-xs font-bold transition-all border ${
            expenseType === 'repairFund'
              ? 'bg-[#ECFDF5] border-[#10B981] text-[#059669] shadow-sm ring-1 ring-[#10B981]'
              : 'bg-[#F6F9FC] border-[#E2E8F0] text-[#52667A] hover:bg-white'
          }`}
        >
          🔨 {lang === 'ro' ? 'Fond Reparații Bloc' : lang === 'fa' ? 'صندوق تعمیرات اساسی' : 'Building Reserve Fund'}
        </button>

        <button
          type="button"
          onClick={() => setExpenseType('brokenPipe')}
          className={`p-3 rounded-xl text-start text-xs font-bold transition-all border ${
            expenseType === 'brokenPipe'
              ? 'bg-[#FFF7E6] border-[#F59E0B] text-[#B45309] shadow-sm ring-1 ring-[#F59E0B]'
              : 'bg-[#F6F9FC] border-[#E2E8F0] text-[#52667A] hover:bg-white'
          }`}
        >
          ⚠️ {lang === 'ro' ? 'Daună Neglijență' : lang === 'fa' ? 'خسارت ناشی از سهل‌انگاری' : 'Occupant Damage'}
        </button>

        <button
          type="button"
          onClick={() => setExpenseType('capitalUpgrade')}
          className={`p-3 rounded-xl text-start text-xs font-bold transition-all border ${
            expenseType === 'capitalUpgrade'
              ? 'bg-[#EDF5FF] border-[#2F80ED] text-[#1E62C4] shadow-sm ring-1 ring-[#2F80ED]'
              : 'bg-[#F6F9FC] border-[#E2E8F0] text-[#52667A] hover:bg-white'
          }`}
        >
          ⚡ {lang === 'ro' ? 'Investiție / Modernizare' : lang === 'fa' ? 'ارتقای تأسیسات و سرمایه‌ای' : 'Capital Modernization'}
        </button>
      </div>

      {/* 4 Dimensions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F6F9FC] border border-[#E2E8F0]">
        <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
          <span className="text-[11px] text-[#7B8A9A] block font-mono font-medium">1. Legal Debtor (Lege 196)</span>
          <span className="text-sm font-bold text-[#0E9F8E]">{current.legalDebtor}</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
          <span className="text-[11px] text-[#7B8A9A] block font-mono font-medium">2. Operational Payer</span>
          <span className="text-sm font-bold text-[#059669]">{current.operationalPayer}</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
          <span className="text-[11px] text-[#7B8A9A] block font-mono font-medium">3. Economic Beneficiary</span>
          <span className="text-sm font-bold text-[#102A43]">{current.beneficiary}</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
          <span className="text-[11px] text-[#7B8A9A] block font-mono font-medium">4. Reimbursement Flow</span>
          <span className="text-sm font-bold text-[#B45309]">{current.reimbursement}</span>
        </div>
      </div>

      {/* Dynamic Split Breakdown Visual */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        
        {/* Split Cards */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ECFDF5] text-[#059669]">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-[#7B8A9A] block">
                  {lang === 'ro' ? 'Facturat către Proprietar' : lang === 'fa' ? 'سهم فاکتور مالک' : 'Billed to Owner'}
                </span>
                <span className="text-sm font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Fonduri / Valoare Activ' : lang === 'fa' ? 'صندوق‌ها / ارزش دارایی' : 'Capital & Reserve'}
                </span>
              </div>
            </div>
            <div className="text-xl font-display font-extrabold text-[#059669] tabular-nums">
              {current.split.owner.toFixed(2)} RON
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#EAF8F5] text-[#0E9F8E]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-[#7B8A9A] block">
                  {lang === 'ro' ? 'Facturat către Chiriaș' : lang === 'fa' ? 'سهم فاکتور مستأجر' : 'Billed to Tenant'}
                </span>
                <span className="text-sm font-bold text-[#102A43]">
                  {lang === 'ro' ? 'Consum & Servicii Operative' : lang === 'fa' ? 'مصارف روزمره و انشعابات' : 'Operations & Utilities'}
                </span>
              </div>
            </div>
            <div className="text-xl font-display font-extrabold text-[#0E9F8E] tabular-nums">
              {current.split.tenant.toFixed(2)} RON
            </div>
          </div>
        </div>

        {/* Legal & Compliance Insight */}
        <div className="p-4 rounded-xl bg-[#EAF8F5] border border-[#B2E5DF] text-xs text-[#0A6E62] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#0A6E62]">
            <Info className="w-4 h-4 text-[#0E9F8E]" />
            <span>{lang === 'ro' ? 'De ce contează această separare?' : lang === 'fa' ? 'چرا این تفکیک دقیق اهمیت دارد؟' : 'Why this precision matters'}</span>
          </div>
          <p className="leading-relaxed text-[#52667A]">
            {current.explanation}
          </p>
        </div>

      </div>
    </div>
  );
};
