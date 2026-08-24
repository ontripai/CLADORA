import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PRODUCT_METRICS } from '@/config/product-metrics';
import {
  Network,
  Layers,
  FileText,
  Scale,
  Droplets,
  CreditCard,
  FileCheck,
  ShieldCheck,
  Database,
  ArrowRight,
  Sparkles,
  Zap,
  Mail,
  Upload,
  FileSpreadsheet,
  Cpu
} from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/information-architecture', params.lang);
}

export default function InformationArchitecturePage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const intakeChannels = [
    { name: 'e-Factura SPV', type: 'RO e-Factura XML UBL 2.1', icon: Zap, color: 'text-cyan-400' },
    { name: 'Dedicated Inbound Email', type: 'MIME Parser & PDF Attachment', icon: Mail, color: 'text-emerald-400' },
    { name: 'PDF & Image Upload', type: 'Direct UI Multi-file Ingestion', icon: Upload, color: 'text-amber-400' },
    { name: 'Batch CSV Ingestion', type: 'Standardized Structured Import', icon: FileSpreadsheet, color: 'text-purple-400' },
    { name: 'REST API & EDI', type: 'Vendor Webhook Pipeline', icon: Cpu, color: 'text-blue-400' },
    { name: 'Automated OCR Service', type: 'Neural Text & Table Extraction', icon: FileText, color: 'text-pink-400' },
  ];

  const m25Relationships = [
    { title: 'Core Accounting', code: 'C01 / 605.xx / 611.xx', desc: 'Direct general ledger posting with statutory expense allocation accounts.', icon: Scale },
    { title: 'Metering & Sub-metering', code: 'C08 / Radio & Photo OCR', desc: 'Bi-directional index reconciliation and anomalous variance detection.', icon: Droplets },
    { title: 'Payments & Treasury', code: 'C03 / Bank Reconciliation', desc: 'OP generation, IBAN verification, and bank statement matching.', icon: CreditCard },
    { title: 'Documents & Archive', code: 'Secure Blob Store', desc: 'Original scan preservation, digital stamp, and compliance retention.', icon: FileCheck },
    { title: 'Bank Reconciliation', code: 'Auto-Match Engine', desc: 'Automated transaction pairing with partial-payment exception triggers.', icon: Database },
    { title: 'Audit Trail & Compliance', code: 'Immutable Event Log', desc: 'Full event history: Actor, Role, Timestamp, Evidence, Audit ID.', icon: ShieldCheck },
  ];

  return (
    <div className="pt-28 pb-24 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Network className="w-3.5 h-3.5" />
          <span>CLADORA Architecture Blueprint</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Arhitectura Informațională CLADORA' : isFa ? 'معماری اطلاعات و ساختار ماژول‌های کلادورا' : 'CLADORA Information Architecture'}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isRo
            ? 'Harta ierarhică a nucleelor logice, spațiilor de lucru și relațiilor inter-modulare.'
            : isFa
            ? 'نقشه ساختاری ماژول‌های پلتفرم و پیوندهای داده‌ای میان هسته‌های نرم‌افزاری.'
            : 'Complete hierarchical blueprint of logical cores, workspaces, and inter-module data pipelines.'}
        </p>
      </div>

      {/* Product Metrics Totals Counter Strip */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
        <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-extrabold text-violet-300 font-mono">{PRODUCT_METRICS.managerWorkspaces}</div>
          <div className="text-xs text-slate-400 font-medium">{isRo ? 'Spații de lucru Manager' : isFa ? 'فضاهای کاری مدیر' : 'Manager Workspaces'}</div>
        </div>
        <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">{PRODUCT_METRICS.totalBaseScreens}</div>
          <div className="text-xs text-slate-400 font-medium">{isRo ? 'Total ecrane de bază' : isFa ? 'مجموع صفحات پایه' : 'Total Base Screens'}</div>
        </div>
        <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">{PRODUCT_METRICS.totalResponsiveBaseViews}</div>
          <div className="text-xs text-slate-400 font-medium">{isRo ? 'Total vizualizări responsive' : isFa ? 'مجموع نماهای واکنش‌گرا' : 'Total Responsive Views'}</div>
        </div>
        <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">{PRODUCT_METRICS.prototypeJourneys}</div>
          <div className="text-xs text-slate-400 font-medium">{isRo ? 'Parcursuri prototip' : isFa ? 'مسیرهای پروتوتایپ' : 'Prototype Journeys'}</div>
        </div>
        <div className="space-y-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-pink-300 font-mono">{PRODUCT_METRICS.userTestingTasks}</div>
          <div className="text-xs text-slate-400 font-medium">{isRo ? 'Sarcini testare utilizatori' : isFa ? 'وظایف آزمون کاربر' : 'User Testing Tasks'}</div>
        </div>
      </div>

      {/* Featured Architecture Section: Manager → Finance → M25 Utility Bills */}
      <div className="p-8 rounded-3xl glass-panel border border-violet-500/40 bg-gradient-to-b from-violet-950/20 to-slate-950/80 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-violet-500/20 text-violet-300 font-mono text-xs font-semibold border border-violet-500/30">
                Manager → Finance → M25
              </span>
              <span className="text-xs text-slate-400">High-Density Intelligence Workspace</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              M25 — Utility Bills & Invoice Intelligence
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isRo
                ? 'Modulul central de ingestie, reconciliere și repartizare automată a cheltuielilor de utilități și facturilor de mentenanță.'
                : isFa
                ? 'ماژول مرکزی دریافت، تطبیق و تسهیم خودکار هزینه‌های انشعابات و قبوض خدمات ساختمانی.'
                : 'Centralized workspace for multi-source ingestion, meter reconciliation, tariff verification, and statutory expense allocation.'}
            </p>
          </div>

          <Link
            href={`/${lang}/ui/manager/utility-bills`}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 inline-flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <span>{isRo ? 'Deschide Spațiul de Lucru M25' : isFa ? 'مشاهده پنل کاری M25' : 'Open M25 Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 6 Conceptual Intake Sources */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{isRo ? '1. Canale de Ingestie & Formate Documente' : isFa ? '۱. درگاه‌های دریافت و قالب‌های اسناد' : '1. Ingestion Channels & Intake Protocols'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {intakeChannels.map((ch, idx) => {
              const Icon = ch.icon;
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-slate-800 border border-slate-700 ${ch.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{ch.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{ch.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6 Structural Relationships to Cores */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>{isRo ? '2. Relații Structurale cu Modulele Platformei' : isFa ? '۲. پیوندهای ساختاری با سایر بخش‌های سیستم' : '2. Core Structural Relationships'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {m25Relationships.map((rel, idx) => {
              const Icon = rel.icon;
              return (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {rel.code}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{rel.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rel.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
