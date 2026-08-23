import React from 'react';
import { Language } from '@/types';
import { ShieldCheck, UserCheck, Key, ArrowRightLeft } from 'lucide-react';
import { AllocationSimulator } from '@/components/interactive/AllocationSimulator';

interface OwnerTenantSectionProps {
  lang: Language;
}

export const OwnerTenantSeparationSection: React.FC<OwnerTenantSectionProps> = ({ lang }) => {
  const dimensions = [
    {
      title: lang === 'ro' ? '1. Debitor Legal' : lang === 'fa' ? '۱. مدیون قانونی' : '1. Legal Debtor',
      role: lang === 'ro' ? 'Proprietarul' : lang === 'fa' ? 'مالک واحد' : 'Unit Owner',
      desc: lang === 'ro' 
        ? 'Răspunde legal în fața Asociației de Proprietari conform Legii 196/2018 pentru toate cotele.' 
        : lang === 'fa'
        ? 'پاسخگوی رسمی در برابر انجمن مالکان و قانون برای تمامی بدهی‌های ملک.'
        : 'Legally liable to the Condominium Association under Romanian Law 196/2018.',
      icon: ShieldCheck,
      color: 'text-[#102A43] bg-[#F0F4F8]'
    },
    {
      title: lang === 'ro' ? '2. Plătitor Operațional' : lang === 'fa' ? '۲. پرداخت‌کننده مصرفی' : '2. Operational Payer',
      role: lang === 'ro' ? 'Chiriașul' : lang === 'fa' ? 'مستأجر ساکن' : 'Tenant',
      desc: lang === 'ro' 
        ? 'Plătește direct consumul de utilități (apă, gaze, salubrizare, energie părți comune).' 
        : lang === 'fa'
        ? 'پرداخت مستقیم مصارف روزمره (آب، گرمایش، نظافت، برق آسانسور و مشاعات).'
        : 'Directly remits consumption charges (water, heating, shared elevator power, waste).',
      icon: Key,
      color: 'text-[#0E9F8E] bg-[#EAF8F5]'
    },
    {
      title: lang === 'ro' ? '3. Beneficiar Economic' : lang === 'fa' ? '۳. ذینفع سرمایه‌ای' : '3. Capital Beneficiary',
      role: lang === 'ro' ? 'Proprietarul' : lang === 'fa' ? 'مالک واحد' : 'Unit Owner',
      desc: lang === 'ro' 
        ? 'Suportă fondul de reparații și investițiile de capital care cresc valoarea activului.' 
        : lang === 'fa'
        ? 'تأمین صندوق تعمیرات اساسی و سرمایه‌گذاری‌های زیربنایی که ارزش ملک را ارتقا می‌دهد.'
        : 'Bears long-term reserve funds, major structural overhauls and asset upgrades.',
      icon: UserCheck,
      color: 'text-[#2F80ED] bg-[#EDF5FF]'
    },
    {
      title: lang === 'ro' ? '4. Flux Decontare' : lang === 'fa' ? '۴. تسویه خودکار' : '4. Reimbursement Flow',
      role: lang === 'ro' ? 'Automatizat CLADORA' : lang === 'fa' ? 'خودکار در کلادورا' : 'Automated in CLADORA',
      desc: lang === 'ro' 
        ? 'Calcul transparent și clar la predarea apartamentului sau la final de lună.' 
        : lang === 'fa'
        ? 'محاسبه شفاف و تفکیک‌شده بدون نیاز به محاسبات دستی و ابهام میان طرفین.'
        : 'Clean transparent statements without spreadsheet reconciliation confusion.',
      icon: ArrowRightLeft,
      color: 'text-[#FF7A59] bg-[#FFF0EB]'
    }
  ];

  return (
    <section className="py-24 bg-[#F6F9FC] border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0A6E62] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Separarea Drepturilor 5D' : lang === 'fa' ? 'تفکیک ۵ بعدی حقوق و تعهدات' : '5D Rights Isolation'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Separare Clară a Cheltuielilor între Proprietar și Chiriaș' 
              : lang === 'fa'
              ? 'تفکیک روشن هزینه‌های مالک و مستأجر'
              : 'Clear Owner–Tenant Expense Separation'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Unul dintre cele mai mari puncte de tensiune în blocurile din România este împărțirea costurilor între proprietar și chiriaș. CLADORA rezolvă acest lucru nativ.'
              : lang === 'fa'
              ? 'یکی از رایج‌ترین چالش‌ها در مجتمع‌های مسکونی، تسهیم هزینه‌های ماهانه میان مالک و مستأجر است. کلادورا این موضوع را به‌صورت خودکار و سیستمی حل می‌کند.'
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
                    <span className="text-xs font-bold text-[#52667A]">{dim.title}</span>
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
