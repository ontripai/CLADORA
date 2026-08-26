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

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Language }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return getRouteMetadata('/wireframes/manager', params.lang);
}

export default async function ManagerWireframesPage(
  props: {
    params: Promise<{ lang: Language }>;
  }
) {
  const params = await props.params;
  const dict = getDictionary(params.lang);
  const lang = params.lang;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="pt-28 pb-24 space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
      {/* Header Card */}
      <div className="card-proptech p-6 sm:p-8 bg-white border-[#E2E8F0] space-y-3 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF8F5] border border-[#B2E5DF] text-xs font-bold text-[#0A6E62]">
          <Layout className="w-3.5 h-3.5 text-[#0A6E62]" />
          <span>High-Density Responsive Wireframes</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43] tracking-tight">
          {isRo ? 'Specificații Wireframes Manager OS' : isFa ? 'مشخصات وایرفریم‌های پنل مدیریت' : 'Manager OS Wireframe Specifications'}
        </h1>
        <p className="text-sm text-[#52667A] max-w-2xl mx-auto">
          {isRo
            ? 'Arhitectura vizuală și comportamentul adaptiv pentru Desktop (1440px+), Tabletă (768px-1024px) și Mobil (375px-430px).'
            : isFa
            ? 'طراحی چیدمان واکنش‌گرا برای نمایشگرهای دسکتاپ، تبلت و موبایل بدون افت کارایی و اطلاعات.'
            : 'Visual layout and responsive adaptations across Desktop (1440px+), Tablet (768px-1024px), and Mobile (375px-430px).'}
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="card-proptech p-4 bg-white border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#52667A]">
        <div>{dict.metrics.productionModules}: <strong className="text-[#0A6E62]">{PRODUCT_METRICS.productionModules}</strong></div>
        <div>{dict.metrics.totalBaseScreens}: <strong className="text-[#1E40AF]">{PRODUCT_METRICS.totalBaseScreens}</strong></div>
        <div>{dict.metrics.totalResponsiveBaseViews}: <strong className="text-[#065F46]">{PRODUCT_METRICS.totalResponsiveBaseViews}</strong></div>
      </div>

      {/* 3 Viewport Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Desktop 1440px Viewport */}
        <div className="card-proptech p-6 bg-white border-[#E2E8F0] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#EDF5FF] text-[#1E40AF]">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F4F8] text-[#102A43] border border-[#D3DCE6]">
                1440 × 900+
              </span>
            </div>

            <h3 className="text-base font-display font-extrabold text-[#102A43]">
              {isRo ? 'Dispunere Desktop — 2 Coloane Alăturate' : isFa ? 'چیدمان دسکتاپ — ۲ ستون همزمان' : 'Desktop Two-Column Workspace'}
            </h3>

            <p className="text-xs text-[#52667A] leading-relaxed">
              {isRo
                ? 'Coadă tabelară densă de facturi în stânga (5 coloane grid) și panou de inspecție complet în dreapta (7 coloane grid) cu taburi pentru date extrase vs scan PDF.'
                : isFa
                ? 'جدول داده‌های متراکم در سمت راست و پنل نمایش جزییات و فایل اصلی در سمت چپ با تب‌های تعاملی.'
                : 'Dense 5-column queue table on the left and full 7-column detail surface on the right with tabbed extracted data vs original scan inspection.'}
            </p>

            <div className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] font-mono text-[11px] text-[#52667A] space-y-1">
              <div>Grid: <strong>5 Cols (Queue) / 7 Cols (Detail)</strong></div>
              <div>Filters: <strong>7 Dropdowns Row + Toggle</strong></div>
              <div>Confirmation: <strong>Centered 11-field Modal</strong></div>
            </div>
          </div>

          <Link
            href={`/${lang}/ui/manager/utility-bills`}
            className="w-full py-2.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] text-xs font-bold border border-[#D3DCE6] text-center block transition-all"
          >
            {isRo ? 'Vezi Vizualizarea Desktop' : isFa ? 'مشاهده نسخه دسکتاپ' : 'View Desktop Layout'}
          </Link>
        </div>

        {/* 2. Tablet 768px-1024px Viewport */}
        <div className="card-proptech p-6 bg-white border-[#E2E8F0] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#EAF8F5] text-[#0A6E62]">
                <Tablet className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F4F8] text-[#102A43] border border-[#D3DCE6]">
                820 × 1180
              </span>
            </div>

            <h3 className="text-base font-display font-extrabold text-[#102A43]">
              {isRo ? 'Dispunere Tabletă — Adaptivă Hibridă' : isFa ? 'چیدمان تبلت — انطباق‌پذیر هیبریدی' : 'Tablet Hybrid Responsive'}
            </h3>

            <p className="text-xs text-[#52667A] leading-relaxed">
              {isRo
                ? 'Filtre compactate în grid de 3 coloane, tabel optimizat cu scroll orizontal securizat și panou de detalii extins cu butoane de acțiune touch.'
                : isFa
                ? 'فیلترهای ۳ ستونه با چینش لمسی و امکان مشاهده سریع جزییات با حفظ ساختار مالی.'
                : '3-column filter grid adaptation, touch-optimized selection rows, and preserved dual-pane inspection workflow.'}
            </p>

            <div className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] font-mono text-[11px] text-[#52667A] space-y-1">
              <div>Grid: <strong>Vertical Stack or 2-Pane Adapt</strong></div>
              <div>Filters: <strong>Compact 3-col Grid</strong></div>
              <div>Touch Target: <strong>Min 44px on all actions</strong></div>
            </div>
          </div>

          <Link
            href={`/${lang}/ui/manager/utility-bills`}
            className="w-full py-2.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] text-xs font-bold border border-[#D3DCE6] text-center block transition-all"
          >
            {isRo ? 'Vezi Vizualizarea Tabletă' : isFa ? 'مشاهده نسخه تبلت' : 'View Tablet Layout'}
          </Link>
        </div>

        {/* 3. Mobile 375px-430px Viewport */}
        <div className="card-proptech p-6 bg-white border-[#E2E8F0] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-[#FFF7E6] text-[#92400E]">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F0F4F8] text-[#102A43] border border-[#D3DCE6]">
                390 × 844
              </span>
            </div>

            <h3 className="text-base font-display font-extrabold text-[#102A43]">
              {isRo ? 'Dispunere Mobil — Carduri & Bottom Sheet' : isFa ? 'چیدمان موبایل — کارت‌ها و منوی کشویی' : 'Mobile Cards & Bottom Sheet'}
            </h3>

            <p className="text-xs text-[#52667A] leading-relaxed">
              {isRo
                ? 'Înlocuirea tabelului cu carduri touch-friendly, drawer Bottom Sheet pentru toate cele 7 filtre și suprafață completă de confirmare fără pierdere de funcționalitate.'
                : isFa
                ? 'جایگزینی جدول با کارت‌های لمسی با دسترسی آسان به دکمه تأیید و فیلترهای کامل در کشوی پایینی.'
                : 'Card list replacing desktop table, native Bottom Sheet drawer for 7 filters, and zero loss of confirmation capabilities.'}
            </p>

            <div className="p-3 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] font-mono text-[11px] text-[#52667A] space-y-1">
              <div>Queue: <strong>Touch Card List with OCR pills</strong></div>
              <div>Filters: <strong>Accessible Bottom Sheet Drawer</strong></div>
              <div>Thumb Reach: <strong>Sticky Primary Action</strong></div>
            </div>
          </div>

          <Link
            href={`/${lang}/ui/manager/utility-bills`}
            className="w-full py-2.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] text-xs font-bold border border-[#D3DCE6] text-center block transition-all"
          >
            {isRo ? 'Vezi Vizualizarea Mobil' : isFa ? 'مشاهده نسخه موبایل' : 'View Mobile Layout'}
          </Link>
        </div>

      </div>
    </div>
  );
}
