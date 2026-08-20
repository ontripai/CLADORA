'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Scale, Info, CheckCircle2, User, Home, ArrowRight, ShieldAlert } from 'lucide-react';

interface AllocationSimulatorProps {
  lang: Language;
}

export const AllocationSimulator: React.FC<AllocationSimulatorProps> = ({ lang }) => {
  const [expenseType, setExpenseType] = useState<'consumption' | 'repairFund' | 'brokenPipe' | 'capitalUpgrade'>('consumption');
  const [amount, setAmount] = useState<number>(450);

  const scenarios = {
    consumption: {
      name: lang === 'ro' ? 'Consum Apă Caldă & Menajeră' : 'Water & Utility Consumption',
      legalDebtor: lang === 'ro' ? 'Proprietar (Ap. 14)' : 'Owner (Unit 14)',
      operationalPayer: lang === 'ro' ? 'Chiriaș (Alex Popescu)' : 'Tenant (Alex Popescu)',
      beneficiary: lang === 'ro' ? 'Locatar curent' : 'Current Occupant',
      reimbursement: lang === 'ro' ? 'Achitat direct de chiriaș prin aplicație' : 'Paid directly by tenant via app',
      explanation: lang === 'ro'
        ? 'Conform Legii 196/2018 și contractului de închiriere, consumurile curente sunt suportate operațional de cel care locuiește, dar asociația are ca garant legal proprietarul.'
        : 'Under Law 196/2018 and the lease agreement, operational consumption is billed directly to the active tenant while keeping the owner as statutory guarantor.',
      split: { owner: 0, tenant: amount },
    },
    repairFund: {
      name: lang === 'ro' ? 'Cotă Fond de Reparații (Reparație Acoperiș)' : 'Capital Repair Fund (Roof Repair)',
      legalDebtor: lang === 'ro' ? 'Proprietar (Ap. 14)' : 'Owner (Unit 14)',
      operationalPayer: lang === 'ro' ? 'Proprietar (Radu Ionescu)' : 'Owner (Radu Ionescu)',
      beneficiary: lang === 'ro' ? 'Valoarea Patrimonială a Imobilului' : 'Asset Capital Value',
      reimbursement: lang === 'ro' ? 'Nu se transferă chiriașului (Interzis prin lege)' : 'Non-transferable to tenant (Statutory rule)',
      explanation: lang === 'ro'
        ? 'Fondul de reparații și investițiile capitale cresc valoarea activului și sunt strict în sarcina proprietarului. CLADORA nu le include pe nota de plată a chiriașului.'
        : 'Reserve fund quotas increase the long-term equity of the building and are strictly the owner’s liability. CLADORA prevents accidental billing to the tenant.',
      split: { owner: amount, tenant: 0 },
    },
    brokenPipe: {
      name: lang === 'ro' ? 'Daună Neglijență (Robinet Lăsat Deschis)' : 'Occupant Negligence Damage',
      legalDebtor: lang === 'ro' ? 'Proprietar (Răspundere terț)' : 'Owner (Third-party liability)',
      operationalPayer: lang === 'ro' ? 'Chiriaș (Responsabil de daună)' : 'Tenant (At-fault party)',
      beneficiary: lang === 'ro' ? 'Vecin Afectat (Ap. 10)' : 'Affected Neighbor (Unit 10)',
      reimbursement: lang === 'ro' ? 'Reținut din Garanție / Facturat Chiriaș' : 'Deducted from Security Deposit',
      explanation: lang === 'ro'
        ? 'CLADORA generează un dosar probatoriu cu data incidentului, permițând decontarea automată din depozitul de garanție al chiriașului fără litigii.'
        : 'CLADORA creates an immutable evidence log with timestamps, enabling automatic settlement against the security deposit.',
      split: { owner: 0, tenant: amount },
    },
    capitalUpgrade: {
      name: lang === 'ro' ? 'Modernizare Lift / Panouri Solare' : 'Modernization (Elevator / Solar Panels)',
      legalDebtor: lang === 'ro' ? 'Proprietar (Cotă-parte CPI)' : 'Owner (Undivided share CPI)',
      operationalPayer: lang === 'ro' ? 'Proprietar (Fond Investiții)' : 'Owner (Investment Fund)',
      beneficiary: lang === 'ro' ? 'Comunitate & Eficiență Energetică' : 'Community & Energy Efficiency',
      reimbursement: lang === 'ro' ? 'Investiție Amortizabilă' : 'Capitalized Asset Investment',
      explanation: lang === 'ro'
        ? 'Calculat automat după Cota-Parte Indiviză (CPI) a apartamentului. Înregistrat în registrul de valoare a clădirii pentru creșterea prețului de vânzare/închiriere.'
        : 'Automatically computed by the unit’s CPI share. Logged in the Building Value Ledger to increase market valuation.',
      split: { owner: amount, tenant: 0 },
    },
  };

  const current = scenarios[expenseType];

  return (
    <div id="simulator" className="p-6 sm:p-8 rounded-3xl glass-panel border border-brand-500/20 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
            <Scale className="w-4 h-4 text-brand-400" />
            <span>{lang === 'ro' ? 'Simulator Interactiv de Alocare (Core C02)' : 'Interactive 4-Way Rights Simulator (Core C02)'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            {lang === 'ro' ? 'Separarea Cheltuielilor: Proprietar vs. Chiriaș' : 'Owner vs. Tenant 4-Dimensional Expense Split'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="invoiceAmountInput" className="text-xs text-slate-300 font-medium">
            {lang === 'ro' ? 'Sumă Factură:' : 'Invoice Amount:'}
          </label>
          <input
            id="invoiceAmountInput"
            name="invoiceAmount"
            type="number"
            aria-label={lang === 'ro' ? 'Sumă factură în RON' : 'Invoice amount in RON'}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="w-28 px-3 py-1.5 rounded-lg bg-surface-100 border border-white/15 text-white font-mono text-sm font-bold text-right focus:border-brand-400 focus:outline-none"
          />
          <span className="text-xs font-mono text-slate-300 font-semibold">RON</span>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-6 pb-6">
        <button
          onClick={() => setExpenseType('consumption')}
          className={`p-3 rounded-xl text-left text-xs font-semibold transition-all border ${
            expenseType === 'consumption'
              ? 'bg-brand-500/30 border-brand-400 text-white shadow-glow-cyan'
              : 'glass-panel border-white/10 text-slate-200 hover:text-white'
          }`}
        >
          🚰 {lang === 'ro' ? 'Consum Curent Utilități' : 'Utility Consumption'}
        </button>

        <button
          onClick={() => setExpenseType('repairFund')}
          className={`p-3 rounded-xl text-left text-xs font-semibold transition-all border ${
            expenseType === 'repairFund'
              ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-glow-emerald'
              : 'glass-panel border-white/10 text-slate-200 hover:text-white'
          }`}
        >
          🔨 {lang === 'ro' ? 'Fond Reparații Bloc' : 'Building Reserve Fund'}
        </button>

        <button
          onClick={() => setExpenseType('brokenPipe')}
          className={`p-3 rounded-xl text-left text-xs font-semibold transition-all border ${
            expenseType === 'brokenPipe'
              ? 'bg-amber-500/30 border-amber-400 text-white'
              : 'glass-panel border-white/10 text-slate-200 hover:text-white'
          }`}
        >
          ⚠️ {lang === 'ro' ? 'Daună Neglijență' : 'Occupant Damage'}
        </button>

        <button
          onClick={() => setExpenseType('capitalUpgrade')}
          className={`p-3 rounded-xl text-left text-xs font-semibold transition-all border ${
            expenseType === 'capitalUpgrade'
              ? 'bg-violet-500/30 border-violet-400 text-white'
              : 'glass-panel border-white/10 text-slate-200 hover:text-white'
          }`}
        >
          ⚡ {lang === 'ro' ? 'Investiție / Modernizare' : 'Capital Modernization'}
        </button>
      </div>

      {/* 4 Dimensions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface-100/80 border border-white/10">
        <div className="p-3 rounded-xl bg-surface-200/60 space-y-1">
          <span className="text-[11px] text-slate-300 block font-mono font-medium">1. Legal Debtor (Lege 196)</span>
          <span className="text-sm font-bold text-brand-300">{current.legalDebtor}</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-200/60 space-y-1">
          <span className="text-[11px] text-slate-300 block font-mono font-medium">2. Operational Payer</span>
          <span className="text-sm font-bold text-emerald-300">{current.operationalPayer}</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-200/60 space-y-1">
          <span className="text-[11px] text-slate-300 block font-mono font-medium">3. Economic Beneficiary</span>
          <span className="text-sm font-bold text-white">{current.beneficiary}</span>
        </div>

        <div className="p-3 rounded-xl bg-surface-200/60 space-y-1">
          <span className="text-[11px] text-slate-300 block font-mono font-medium">4. Reimbursement Flow</span>
          <span className="text-sm font-bold text-gold-400">{current.reimbursement}</span>
        </div>
      </div>

      {/* Dynamic Split Breakdown Visual */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        
        {/* Split Cards */}
        <div className="space-y-3">
          <div className="p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-300 block">{lang === 'ro' ? 'Facturat către Proprietar' : 'Billed to Owner'}</span>
                <span className="text-sm font-semibold text-white">{lang === 'ro' ? 'Fonduri / Valoare Activ' : 'Capital & Reserve'}</span>
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              {current.split.owner.toFixed(2)} RON
            </div>
          </div>

          <div className="p-4 rounded-xl glass-panel border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-500/20 text-brand-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-300 block">{lang === 'ro' ? 'Facturat către Chiriaș' : 'Billed to Tenant'}</span>
                <span className="text-sm font-semibold text-white">{lang === 'ro' ? 'Consum & Servicii Operative' : 'Operations & Utilities'}</span>
              </div>
            </div>
            <div className="text-xl font-mono font-bold text-brand-300">
              {current.split.tenant.toFixed(2)} RON
            </div>
          </div>
        </div>

        {/* Legal & Compliance Insight */}
        <div className="p-4 rounded-xl bg-brand-500/15 border border-brand-500/30 text-xs text-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-brand-200">
            <Info className="w-4 h-4 text-brand-300" />
            <span>{lang === 'ro' ? 'De ce contează această separare?' : 'Why this precision matters'}</span>
          </div>
          <p className="leading-relaxed">
            {current.explanation}
          </p>
        </div>

      </div>
    </div>
  );
};
