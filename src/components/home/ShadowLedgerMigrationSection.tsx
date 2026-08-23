import React from 'react';
import { Language } from '@/types';
import { ShadowLedgerDemo } from '@/components/interactive/ShadowLedgerDemo';

interface MigrationSectionProps {
  lang: Language;
}

export const ShadowLedgerMigrationSection: React.FC<MigrationSectionProps> = ({ lang }) => {
  const steps = [
    {
      num: '01',
      title: lang === 'ro' ? 'Import Date Vechi' : lang === 'fa' ? 'فراخوانی داده‌های قدیمی' : 'Legacy Data Import',
      desc: lang === 'ro' 
        ? 'Preluare baze de date din BlocManager, Xisoft, Aviziero, Platformis sau fișiere Excel.' 
        : lang === 'fa'
        ? 'دریافت پایگاه‌های داده قبلی از نرم‌افزارهای سنتی یا فایل‌های اکسل و حسابداری.'
        : 'Ingest raw data exports from legacy software (BlocManager, Xisoft, Excel tables).'
    },
    {
      num: '02',
      title: lang === 'ro' ? 'Reconciliere Automată' : lang === 'fa' ? 'کشف خودکار مغایرت‌ها' : 'Variance Detection',
      desc: lang === 'ro' 
        ? 'Motorul Shadow Ledger identifică restanțe calculate eronat, fonduri amestecate și erori de penalitate.' 
        : lang === 'fa'
        ? 'موتور Shadow Ledger مغایرت‌های محاسباتی مانده‌ها، جرایم غیرقانونی و تداخل صندوق‌ها را کشف می‌کند.'
        : 'Shadow Ledger algorithms audit historical balances, penalty caps, and fund splits.'
    },
    {
      num: '03',
      title: lang === 'ro' ? 'Rulare în Paralel' : lang === 'fa' ? 'اجرای موازی و بدون ریسک' : 'Parallel Dual Run',
      desc: lang === 'ro' 
        ? 'Rulăm 1–3 luni în paralel cu softul existent până când comitetul și cenzorul au încredere 100%.' 
        : lang === 'fa'
        ? 'فعالیت موازی ۱ تا ۳ دوره با سامانه قبلی تا اطمینان ۱۰۰ درصدی هیئت‌مدیره و بازرسان مجتمع.'
        : 'Operate 1–3 billing cycles concurrently until committee and auditors verify 100% accuracy.'
    },
    {
      num: '04',
      title: lang === 'ro' ? 'Comutare Controlată' : lang === 'fa' ? 'استقرار نهایی و پایدار' : 'Controlled Cutover',
      desc: lang === 'ro' 
        ? 'Trecerea definitivă pe CLADORA fără oprirea activității și fără pierderi de istoric contabil.' 
        : lang === 'fa'
        ? 'انتقال قطعی و بی‌وقفه به کلادورا با حفظ کامل سوابق مالی و ترازهای پاکسازی‌شده.'
        : 'Clean transition to production ledger with complete zero-data-loss audit history.'
    }
  ];

  return (
    <section className="py-24 bg-white border-b border-[#E2E8F0] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#0A6E62] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
            {lang === 'ro' ? 'Nucleul C16 — Shadow Ledger' : lang === 'fa' ? 'هسته نرم‌افزاری C16 — پروتکل Shadow Ledger' : 'C16 Core — Shadow Ledger'}
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-[#102A43] tracking-tight">
            {lang === 'ro' 
              ? 'Migrare Controlată cu Rulare Paralelă' 
              : lang === 'fa'
              ? 'مهاجرت کنترل‌شده با اجرای موازی'
              : 'Controlled Migration with Parallel Validation'}
          </h2>
          <p className="text-base sm:text-lg text-[#52667A]">
            {lang === 'ro'
              ? 'Schimbarea programului de administrare este planificată riguros. Protocolul Shadow Ledger rulează în paralel pentru a valida fiecare sold înainte de migrarea definitivă.'
              : lang === 'fa'
              ? 'تغییر نرم‌افزار حسابداری نیازمند دقت بالاست. پروتکل دفتر کل موازی کلادورا در کنار سیستم قبلی اجرا می‌شود تا کلیه مانده‌حساب‌ها پیش از استقرار نهایی اعتبارسنجی شوند.'
              : 'Switching property software requires verified precision. Shadow Ledger runs side-by-side to validate ledger accuracy prior to final cutover.'}
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
