import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { getDictionary } from '@/dictionaries';
import { PRODUCT_METRICS } from '@/config/product-metrics';
import {
  Layout,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  Filter
} from 'lucide-react';

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Language };
}): Promise<Metadata> {
  return getRouteMetadata('/wireframes/manager', params.lang);
}

export default function ManagerWireframesPage({
  params,
}: {
  params: { lang: Language };
}) {
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="pt-28 pb-24 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-panel border border-violet-500/20 text-xs font-semibold text-violet-300">
          <Layout className="w-3.5 h-3.5" />
          <span>High-Density Responsive Wireframes</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          {isRo ? 'Specificații Wireframes Manager OS' : isFa ? 'مشخصات وایرفریم‌های پنل مدیریت' : 'Manager OS Wireframe Specifications'}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isRo
            ? 'Arhitectura vizuală și comportamentul adaptiv pentru Desktop (1440px+), Tabletă (768px-1024px) și Mobil (375px-430px).'
            : isFa
            ? 'طراحی چیدمان واکنش‌گرا برای نمایشگرهای دسکتاپ، تبلت و موبایل بدون افت کارایی و اطلاعات.'
            : 'Visual grid hierarchy and adaptive component layouts for Desktop, Tablet, and Mobile.'}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="p-4 rounded-xl glass-panel border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
        <div>Total Manager Workspaces: <strong className="text-violet-300">{PRODUCT_METRICS.managerWorkspaces}</strong></div>
        <div>Total Base Screens: <strong className="text-cyan-300">{PRODUCT_METRICS.totalBaseScreens}</strong></div>
        <div>Total Responsive Views: <strong className="text-emerald-300">{PRODUCT_METRICS.totalResponsiveBaseViews} (55 × 3)</strong></div>
        <Link
          href={`/${lang}/ui/manager/utility-bills`}
          className="text-violet-400 hover:text-violet-300 font-sans font-semibold inline-flex items-center gap-1"
        >
          <span>{isRo ? 'Vezi UI Interactiv M25' : isFa ? 'مشاهده رابط کاربری M25' : 'View M25 Live UI'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Responsive Viewport Specifications for M25 */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-violet-400" />
          <span>M25 Utility Bills — Responsive Specification</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Desktop Wireframe Spec (1440px+) */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Desktop (1440px+)</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Full Density
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">1. KPI Context Row</strong>
                  4-column grid (Pending Review, Exceptions, Due Soon, Ready to Post) + 6 Intake triggers.
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">2. Split Workspace Layout</strong>
                  5-col invoice queue on left, 7-col side-by-side deep inspection panel on right.
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">3. Human Review Surface</strong>
                  Floating modal / side overlay with full statutory split and audit credentials.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
              Optimal for high-speed batch reconciliation and invoice audit by property managers.
            </div>
          </div>

          {/* Tablet Wireframe Spec (768px - 1024px) */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Tablet className="w-5 h-5 text-violet-400" />
                  <h3 className="text-base font-bold text-white">Tablet (768px - 1024px)</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  Adaptive Grid
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">1. 2x2 Collapsible KPI Grid</strong>
                  Compact metrics tiles with quick-toggle filter pills for exceptions and dates.
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">2. Single-Column Stacked View</strong>
                  Queue occupies full width with smooth drawer slide-out for Bill Detail review.
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">3. Touch-Targeted Review</strong>
                  Finger-friendly 44px approval triggers with biometric/PIN confirmation prompt.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
              Designed for on-site property administrators conducting building inspections.
            </div>
          </div>

          {/* Mobile Wireframe Spec (375px - 430px) */}
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Mobile (375px - 430px)</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Zero Loss
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">1. Vertical High-Contrast Cards</strong>
                  Tables transform into scannable cards displaying amount, due date, and OCR score.
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">2. Bottom Sheet Filters</strong>
                  Swipeable bottom drawer for multi-criteria filtering without cluttering view.
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <strong className="text-white block mb-1">3. Full-Screen Confirmation</strong>
                  Mandatory human confirmation uses full modal viewport with thumb-reachable primary CTA.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
              Full feature parity: no workflow states, exceptions, or audit history removed on mobile.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
