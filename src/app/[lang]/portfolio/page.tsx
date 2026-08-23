import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  TrendingUp, 
  Home, 
  UserCheck, 
  KeyRound, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowRight,
  DollarSign
} from 'lucide-react';





export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/portfolio', params.lang);
}

export default function PortfolioPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="pt-32 pb-24 space-y-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-emerald-500/20 text-xs font-semibold text-emerald-300">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Portfolio OS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {isRo 
            ? 'Control Total Asupra Portofoliului Tău Imobiliar' 
            : isFa
            ? 'مدیریت و پایش یکپارچه سبد املاک و جریان‌های نقدی اجاره'
            : 'Master Your Rental Portfolio & Cash Flows'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.modesSection.portfolio.tagline}
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            href={`/${lang}/pilot`}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-glow-emerald flex items-center gap-2"
          >
            <span>{dict.common.startPilot}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <Link
            href={`/${lang}/pricing`}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 glass-panel hover:text-white"
          >
            {dict.nav.pricing}
          </Link>
        </div>
      </div>

      {/* 3 Core Landlord Advantages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo 
              ? 'Toate Proprietățile într-un Singur Panou' 
              : isFa 
              ? 'کنسول تجمیعی کلیه واحدهای مسکونی' 
              : 'Consolidated Multi-Property Cockpit'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Indiferent dacă ai 2 apartamente în București și 1 în Cluj, vezi fluxul de numerar, încasările și cheltuielile într-un singur cont consolidat.'
              : isFa
              ? 'چه مالک دو واحد در یک شهر باشید و چه چندین ملک در شهرهای مختلف، جریان نقدی، وصول اجاره‌ها و مخارج را در یک حساب متمرکز پایش کنید.'
              : 'Whether you hold 2 units in Bucharest and 1 in Cluj, track cross-building rental yields, occupancy rates, and cash flows seamlessly.'}
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 w-fit">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo 
              ? 'Portal Dedicat pentru Chiriaș' 
              : isFa 
              ? 'پورتال اختصاصی و ایمن برای مستأجران' 
              : 'Scoped Tenant Experience'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Chiriașul primește o aplicație simplă unde își vede doar cota de utilități de plătit și poate trimite indexurile de contor. Fără acces la vot sau date private.'
              : isFa
              ? 'مستأجر اپلیکیشن اختصاصی ساده‌ای دریافت می‌کند که در آن فقط مصارف مصرفی و قبوض جاری را مشاهده کرده و رقم کنتورها را ثبت می‌کند.'
              : 'Tenants get a streamlined mobile portal strictly scoped to their consumption invoices and reading submissions with zero exposure to owner voting.'}
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 w-fit">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo 
              ? 'Raport de Randament Net (Net Yield)' 
              : isFa 
              ? 'محاسبه دقیق بازده خالص سرمایه‌گذاری (Net Yield)' 
              : 'True Net Yield & Value Growth'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Calculează automat randamentul net după deducerea cotelor de mentenanță, a impozitelor și a perioadelor de neocupare.'
              : isFa
              ? 'محاسبه برخط و خودکار بازده خالص پس از کسر هزینه‌های استهلاک، صندوق تعمیرات، مالیات و روزهای خالی ماندن ملک.'
              : 'Real-time calculation of net rental yields after accounting for HOA maintenance funds, property tax, and vacancy intervals.'}
          </p>
        </div>
      </div>

    </div>
  );
}
