import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PRODUCT_METRICS } from '@/config/product-metrics';
import {
  Layers,
  FileText,
  Scale,
  Droplets,
  CreditCard,
  Users,
  Building,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart4,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/ui/manager', params.lang);
}

export default function ManagerConsolePage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const workspaces = [
    {
      id: 'M25',
      title: isRo ? 'Facturi Utilități & OCR Inteligent' : isFa ? 'قبوض آب و برق و استخراج هوشمند' : 'Utility Bills & Invoice Intelligence',
      category: isRo ? 'Financiar & Contabilitate' : isFa ? 'مالی و حسابداری' : 'Finance & Accounting',
      desc: isRo
        ? 'Ingestie multi-canal, reconciliere automată indexuri contoare, verificări de tarife și aprobare umană.'
        : isFa
        ? 'دریافت چندکاناله، تطبیق خودکار شاخص کنتورها، بررسی تعرفه‌ها و تأیید نهایی انسانی.'
        : 'Multi-channel invoice ingestion, meter reconciliation, tariff verification, and human confirmation.',
      href: `/${lang}/ui/manager/utility-bills`,
      badge: 'Active Live Workspace',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Zap,
      featured: true,
    },
    {
      id: 'M01',
      title: isRo ? 'Închidere de Lună în Masă' : isFa ? 'بستن دسته‌ای دوره‌های ماهانه' : 'Batch Month-Close Engine',
      category: isRo ? 'Contabilitate' : isFa ? 'حسابداری' : 'Accounting',
      desc: isRo ? 'Procesare automată liste întreținere pentru portofolii mari.' : isFa ? 'بستن همزمان دوره‌های مالی چندین مجتمع مسکونی.' : 'Batch maintenance sheet computation for multiple associations.',
      href: `/${lang}/app/accounting/month-close`,
      badge: 'Core',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      icon: Scale,
    },
    {
      id: 'M08',
      title: isRo ? 'Dispecerat Mentenanță & SLA' : isFa ? 'تخصیص تیکت‌ها و کنترل SLA' : 'Maintenance Dispatch & SLA',
      category: isRo ? 'Operațiuni' : isFa ? 'عملیات' : 'Operations',
      desc: isRo ? 'Monitorizare tichete, dispecerat tehnicieni și contracte furnizori.' : isFa ? 'ارجاع تیکت‌ها به پیمانکاران و پایش مهلت‌های SLA.' : 'Work order dispatch and vendor performance tracking.',
      href: `/${lang}/app/maintenance`,
      badge: 'Operations',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: Building,
    },
    {
      id: 'M14',
      title: isRo ? 'Telemetrie Contoare & Detecție Pierderi' : isFa ? 'پایش کنتورها و هشدار هدررفت' : 'Telemetry & Leakage Detection',
      category: isRo ? 'Utilități' : isFa ? 'انشعابات' : 'Utilities',
      desc: isRo ? 'Colectare radio M-Bus și foto OCR asistat cu alerte de avarie.' : isFa ? 'قرائت رادیویی و عکس با سامانه هشدار هوشمند مصرف غیرعادی.' : 'Radio M-Bus and photo OCR index collection with anomaly alerts.',
      href: `/${lang}/app/meters`,
      badge: 'Telemetry',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      icon: Droplets,
    },
  ];

  return (
    <div className="pt-28 pb-24 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Layers className="w-3.5 h-3.5" />
          <span>Manager OS Enterprise Suite</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Consola Centralizată Manager OS' : isFa ? 'کنسول مدیریت املاک و مجتمع‌ها' : 'Manager OS Enterprise Console'}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isRo
            ? 'Hub-ul operațional și financiar pentru companii de administrare imobiliară și asociații mari.'
            : isFa
            ? 'مرکز کنترل یکپارچه عملیاتی و مالی برای شرکت‌های مدیریت املاک مسکونی.'
            : 'Enterprise operations and financial management console for residential property managers.'}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div>Total Workspaces: <strong className="text-violet-300">{PRODUCT_METRICS.managerWorkspaces}</strong></div>
        <div>Total Base Screens: <strong className="text-cyan-300">{PRODUCT_METRICS.totalBaseScreens}</strong></div>
        <div>Total Responsive Views: <strong className="text-emerald-300">{PRODUCT_METRICS.totalResponsiveBaseViews}</strong></div>
      </div>

      {/* Featured Workspace Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <span>{isRo ? 'Spații de Lucru Manager' : isFa ? 'فضاهای کاری مدیر' : 'Manager Workspaces'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map((ws) => {
            const Icon = ws.icon;
            return (
              <div
                key={ws.id}
                className={`p-6 rounded-2xl glass-panel border transition-all flex flex-col justify-between ${
                  ws.featured
                    ? 'border-violet-500/50 bg-gradient-to-b from-violet-950/20 to-slate-950/80 shadow-xl shadow-violet-950/30'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {ws.id}
                      </span>
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${ws.badgeColor}`}>
                      {ws.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{ws.category}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{ws.title}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{ws.desc}</p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {ws.featured ? 'AI + Mandatory Human Review' : 'Automated Workflow'}
                  </span>
                  <Link
                    href={ws.href}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-lg shadow-violet-600/20 transition-all"
                  >
                    <span>{isRo ? 'Accesează Spațiul de Lucru' : isFa ? 'ورود به پنل' : 'Open Workspace'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
