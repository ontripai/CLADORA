import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { 
  Layers, 
  Zap, 
  Users2, 
  BarChart4, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Building,
  Clock
} from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  const isRo = params.lang === 'ro';
  const isFa = params.lang === 'fa';
  return {
    title: isRo 
      ? 'Cladora Manager | Software pentru Firme de Administrare Imobile' 
      : isFa
      ? 'سیستم‌عامل شرکت‌های مدیریت املاک و مجتمع‌های پرتعداد | کلادورا'
      : 'Cladora Manager | Enterprise Platform for Property Management Companies',
    description: isRo
      ? 'Infrastructură scalabilă pentru companii de administrare: închidere de lună în masă (Mass Billing), dispecerat tichete și monitorizare SLA.'
      : isFa
      ? 'زیرساخت مقیاس‌پذیر برای شرکت‌های مدیریت املاک: بستن دسته‌ای دوره‌های ماهانه، مرکز دیسپچینگ حوادث و پایش شاخص‌های SLA پیمانکاران.'
      : 'Scalable multi-building management OS: mass batch billing, maintenance dispatch, contractor SLA monitoring, and consolidated treasury.',
  };
}

export default function ManagerPage({
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Layers className="w-3.5 h-3.5" />
          <span>Manager OS</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight">
          {isRo 
            ? 'Scalează Compania de Administrare la Mii de Apartamente' 
            : isFa
            ? 'مقیاس‌پذیری عملیات مدیریت املاک به هزاران واحد مسکونی'
            : 'Scale Your Property Management Operations'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {dict.modesSection.manager.tagline}
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            href={`/${lang}/pilot`}
            className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-brand-500 shadow-lg flex items-center gap-2"
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

      {/* Enterprise Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 w-fit">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo 
              ? 'Închidere de Lună în Masă (Mass Billing)' 
              : isFa 
              ? 'بستن دسته‌ای و هم‌زمان دوره‌های ماهانه' 
              : 'Batch Month-End Billing'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Procesează 10,000 de apartamente din zeci de asociații în mai puțin de 30 de minute, cu generarea automată a listelor oficiale de plată.'
              : isFa
              ? 'محاسبه و صدور خودکار قبوض شارژ برای بیش از ۱۰٬۰۰۰ واحد مسکونی در ده‌ها مجتمع ظرف کمتر از ۳۰ دقیقه بدون تداخل پایگاه‌داده.'
              : 'Execute batch calculations across 10,000+ units in under 30 minutes with zero database contention and instantaneous PDF statement rendering.'}
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 w-fit">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo 
              ? 'Dispecerat Tichete & Monitorizare SLA' 
              : isFa 
              ? 'مرکز دیسپچینگ تیکت‌ها و پایش تعهدات SLA' 
              : 'Ticket Dispatch & Contractor SLAs'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Atribuie comenzi de lucru instalatorilor, electricienilor și firmelor de curățenie. Măsoară timpul de răspuns și satisfacția locatarilor.'
              : isFa
              ? 'تخصیص هوشمند درخواست‌های تعمیرات به تکنسین‌ها و پیمانکاران تخصصی به همراه سنجش زمان پاسخگویی و رضایت ساکنان.'
              : 'Dispatch work orders to technicians and facilities contractors. Track resolution time against contractual SLAs and resident feedback.'}
          </p>
        </div>

        <div className="p-8 rounded-3xl glass-panel border border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
            <Users2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {isRo 
              ? 'Delegare Roluri & Drepturi Echipă' 
              : isFa 
              ? 'تفکیک دسترسی‌های سازمانی و ردپای ممیزی' 
              : 'Granular Staff Delegation & Audit'}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {isRo 
              ? 'Restricționează accesul administratorilor de teren doar la blocurile din zona lor. Cenzorii și contabilii au roluri strict auditate.'
              : isFa
              ? 'محدودسازی دسترسی کارشناسان به مجتمع‌های حوزه مسئولیت، همراه با نظارت یکپارچه بر عملکرد حسابداران و بازرسان مالی.'
              : 'Scope on-site managers to their specific geographical zones while centralizing financial auditing and legal compliance under leadership.'}
          </p>
        </div>
      </div>

    </div>
  );
}
