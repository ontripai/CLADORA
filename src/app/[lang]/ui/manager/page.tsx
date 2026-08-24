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
      badgeColor: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
      icon: Zap,
      isPrimary: true,
    },
    {
      id: 'M01',
      title: isRo ? 'Închidere Lunară & Cote de Întreținere' : isFa ? 'بستن دوره ماهانه و لیست شارژ' : 'Month-End Close & Quotas',
      category: isRo ? 'Financiar & Contabilitate' : isFa ? 'مالی و حسابداری' : 'Finance & Accounting',
      desc: isRo
        ? 'Generare automată a listelor de plată conform cotelor-părți indivize (Legea 196/2018).'
        : isFa
        ? 'محاسبه سهم ماهانه شارژ واحدها بر اساس ضرایب قانونی و قدرالسهم مشاعات.'
        : 'Automated quota sheet generation per Law 196/2018 CPI rules.',
      href: `/${lang}/app/accounting/month-close`,
      badge: 'Core Financial',
      badgeColor: 'bg-[#EDF5FF] text-[#1E40AF] border-[#BDD8FF]',
      icon: Scale,
    },
    {
      id: 'M08',
      title: isRo ? 'Rețea Contoare & Citiri OCR Foto' : isFa ? 'شبکه کنتورها و قرائت تصویری' : 'Meters Network & Photo OCR',
      category: isRo ? 'Operațiuni Tehnice' : isFa ? 'عملیات فنی' : 'Technical Operations',
      desc: isRo
        ? 'Centralizare indexuri radio, citiri foto transmise de locatari și detecție pierderi de rețea.'
        : isFa
        ? 'پایش مصرف انشعابات فرعی، ثبت عکس کنتورها و هشدار هدررفت شبکه.'
        : 'Radio AMR telemetry, resident photo submissions, and leakage detection.',
      href: `/${lang}/app/meters`,
      badge: 'Telemetry Core',
      badgeColor: 'bg-[#FFF7E6] text-[#92400E] border-[#F5B942]',
      icon: Droplets,
    },
    {
      id: 'M02',
      title: isRo ? 'Trezorerie & Reconciliere Bancară' : isFa ? 'خزانه‌داری و تطبیق حساب بانکی' : 'Treasury & Bank Reconciliation',
      category: isRo ? 'Financiar & Plăți' : isFa ? 'مالی و پرداخت‌ها' : 'Treasury & Payments',
      desc: isRo
        ? 'Sincronizare extrase BCR/Open Banking, emitere ordine de plată și reconciliere încasări.'
        : isFa
        ? 'اتصال بانکی، صدور دستور پرداخت و تطبیق صورت‌حساب‌های بانکی.'
        : 'Open Banking sync, payment order drafting, and settlement reconciliation.',
      href: `/${lang}/app/accounting`,
      badge: 'Open Banking',
      badgeColor: 'bg-[#F0F4F8] text-[#102A43] border-[#D3DCE6]',
      icon: CreditCard,
    },
  ];

  return (
    <div className="pt-28 pb-24 space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
      {/* Header Card */}
      <div className="card-proptech p-6 sm:p-8 bg-white border-[#E2E8F0] space-y-3 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF8F5] border border-[#B2E5DF] text-xs font-bold text-[#0A6E62]">
          <Layers className="w-3.5 h-3.5 text-[#0A6E62]" />
          <span>Manager OS Dedicated Workspaces</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43] tracking-tight">
          {isRo ? 'Consola Spațiilor de Lucru Manager' : isFa ? 'کنسول محیط‌های کاری مدیر' : 'Manager Dedicated Workspaces'}
        </h1>
        <p className="text-sm text-[#52667A] max-w-2xl mx-auto">
          {isRo
            ? 'Spațiile de lucru specializate pentru gestiunea asociațiilor de proprietari și portofoliilor de clădiri.'
            : isFa
            ? 'محیط‌های کاری تخصصی جهت مدیریت مجتمع‌های مسکونی، مالی، فنی و ارتباطات مالکان.'
            : 'Specialized workflow consoles for property managers and building operations.'}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="card-proptech p-4 bg-white border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#52667A]">
        <div>{dict.metrics.managerWorkspaces}: <strong className="text-[#0A6E62]">{PRODUCT_METRICS.managerWorkspaces}</strong></div>
        <div>{dict.metrics.productionModules}: <strong className="text-[#1E40AF]">{PRODUCT_METRICS.productionModules}</strong></div>
        <div>{dict.metrics.totalBaseScreens}: <strong className="text-[#065F46]">{PRODUCT_METRICS.totalBaseScreens}</strong></div>
      </div>

      {/* Workspace Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workspaces.map((w) => {
          const Icon = w.icon;
          return (
            <div
              key={w.id}
              className={`card-proptech p-6 sm:p-8 bg-white border-[#E2E8F0] space-y-5 flex flex-col justify-between transition-all ${
                w.isPrimary ? 'border-[#0A6E62] ring-1 ring-[#0A6E62]/30' : 'hover:border-[#B2E5DF]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${w.badgeColor}`}>
                    {w.badge}
                  </span>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#F0F4F8] text-[#102A43] border border-[#D3DCE6]">
                    {w.id}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] text-[#0A6E62]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#52667A] uppercase tracking-wider block">{w.category}</span>
                    <h3 className="text-xl font-display font-extrabold text-[#102A43]">{w.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-[#52667A] leading-relaxed">{w.desc}</p>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0]">
                <Link
                  href={w.href}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition-all shadow-sm ${
                    w.isPrimary
                      ? 'bg-[#0A6E62] hover:bg-[#08544B] text-white'
                      : 'bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] border border-[#D3DCE6]'
                  }`}
                >
                  <span>{isRo ? 'Deschide Workspace-ul' : isFa ? 'ورود به محیط کاری' : 'Open Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
