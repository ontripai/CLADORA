'use client';

import React from 'react';
import { Language } from '@/types';
import { ShieldCheck, UserCheck, Key, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { AllocationSimulator } from '@/components/interactive/AllocationSimulator';

interface OwnerTenantSectionProps {
  lang: Language;
}

export const OwnerTenantSeparationSection: React.FC<OwnerTenantSectionProps> = ({ lang }) => {
  const dimensions = [
    {
      title: lang === 'ro' ? '1. Debitor Legal' : '1. Legal Debtor',
      role: lang === 'ro' ? 'Proprietarul' : 'Unit Owner',
      desc: lang === 'ro' ? 'Răspunde legal în fața Asociației de Proprietari conform Legii 196/2018 pentru toate cotele.' : 'Legally liable to the Condominium Association under Romanian Law 196/2018.',
      icon: ShieldCheck,
      color: 'text-[#102A43] bg-[#F0F4F8]'
    },
    {
      title: lang === 'ro' ? '2. Plătitor Operațional' : '2. Operational Payer',
      role: lang === 'ro' ? 'Chiriașul' : 'Tenant',
      desc: lang === 'ro' ? 'Plătește direct consumul de utilități (apă, gaze, salubrizare, energie părți comune).' : 'Directly remits consumption charges (water, heating, shared elevator power, waste).',
      icon: Key,
      color: 'text-[#0E9F8E] bg-[#EAF8F5]'
    },
    {
      title: lang === 'ro' ? '3. Beneficiar Economic' : '3. Capital Beneficiary',
      role: lang === 'ro' ? 'Proprietarul' : 'Unit Owner',
      desc: lang === 'ro' ? 'Suportă fondul de reparații și investițiile de capital care cresc valoarea activului.' : 'Bears long-term reserve funds, major structural overhauls and asset upgrades.',
      icon: UserCheck,
      color: 'text-[#2F80ED] bg-[#EDF5FF]'
    },
    {
      title: lang === 'ro' ? '4. Flux Decontare' : '4. Reimbursement Flow',
      role: lang === 'ro' ? 'Automatizat CLADORA' : 'Automated in CLADORA',
      desc: lang === 'ro' ? 'Calcul transparent fără certuri la predarea apartamentului sau la final de lună.' : 'Clean friction-free statements without spreadsheet reconciliation disputes.',
      icon: ArrowRightLeft,
      color: 'text-[#FF7A59] bg-[#FFF0EB]'
    }
  ];

  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Separarea Drepturilor 5D' : '5D Rights Isolation'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' ? 'Proprietar vs Chiriaș: Transparență Fără Dispute' : 'Owner vs. Tenant Separation: Zero Friction'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Unul dintre cele mai mari puncte de tensiune în blocurile din România este împărțirea costurilor între proprietar și chiriaș. CLADORA rezolvă acest lucru nativ.'
              : 'CLADORA natively splits legal debtor responsibilities from day-to-day operational consumption charges.'}
          </p>
        </div>

        {/* 4 Dimensions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-14">
          {dimensions.map((dim, idx) => {
            const Icon = dim.icon;
            return (
              <div key={idx} className="card-proptech p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#7B8A9A]">{dim.title}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dim.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-base font-extrabold text-[#102A43] mt-3">
                    {dim.role}
                  </div>
                  <p className="text-xs text-[#52667A] mt-2 leading-relaxed">
                    {dim.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Interactive Allocation Simulator */}
        <div className="mt-14">
          <AllocationSimulator lang={lang} />
        </div>

      </div>
    </section>
  );
};
