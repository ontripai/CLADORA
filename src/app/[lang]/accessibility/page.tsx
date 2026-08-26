import type { Metadata } from 'next';
import { getRouteMetadata } from '@/config/routes-metadata';
import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';




export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ro' }, { lang: 'fa' }];
}


export async function generateMetadata(
  props: {
    params: Promise<{ lang: Language }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return getRouteMetadata('/accessibility', params.lang);
}

export default async function AccessibilityPage(props: { params: Promise<{ lang: Language }> }) {
  const params = await props.params;
  const { lang } = params;

  return (
    <main className="min-h-screen pt-32 pb-24 bg-[#F6F9FC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#52667A] mb-8 font-medium">
          <Link href={`/${lang}`} className="hover:text-[#102A43]">
            {lang === 'ro' ? 'Acasă' : lang === 'fa' ? 'صفحه اصلی' : 'Home'}
          </Link>
          <span>/</span>
          <span className="text-[#102A43] font-bold">
            {lang === 'ro' ? 'Declarație de Accesibilitate' : lang === 'fa' ? 'بیانیه دسترسی‌پذیری' : 'Accessibility Statement'}
          </span>
        </div>

        <div className="card-proptech p-8 sm:p-12 bg-white space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#102A43]">
                {lang === 'ro' 
                  ? 'Declarație de Accesibilitate (WCAG 2.2 AA)' 
                  : lang === 'fa' 
                  ? 'بیانیه انطباق با استانداردهای دسترسی‌پذیری (WCAG 2.2 AA)' 
                  : 'Accessibility Statement (WCAG 2.2 AA)'}
              </h1>
              <p className="text-xs text-[#7B8A9A]">
                {lang === 'ro' ? 'Standard european de accesibilitate web' : lang === 'fa' ? 'استاندارد اروپایی دسترسی‌پذیری وب' : 'European standard for digital accessibility'}
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-[#52667A] space-y-4 text-xs sm:text-sm leading-relaxed border-t border-[#F0F4F8] pt-6">
            <p>
              {lang === 'ro'
                ? 'CLADORA Technologies se angajează să asigure accesibilitatea digitală pentru persoanele cu dizabilități, implementând standardele Web Content Accessibility Guidelines (WCAG) 2.2 nivel AA.'
                : lang === 'fa'
                ? 'کلادورا خود را متعهد به تضمین دسترسی‌پذیری دیجیتال فراگیر برای کلیه کاربران از جمله افراد دارای محدودیت‌های بینایی و حرکتی، مطابق با رهنمودهای دسترسی‌پذیری وب WCAG 2.2 سطح AA می‌داند.'
                : 'CLADORA Technologies is dedicated to ensuring digital accessibility for all users by aligning with Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.'}
            </p>

            <h2 className="text-base font-bold text-[#102A43]">
              {lang === 'ro' ? 'Măsuri Implementate:' : lang === 'fa' ? 'اقدامات فنی پیاده‌سازی‌شده:' : 'Implemented Standards:'}
            </h2>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                <span>
                  {lang === 'ro' 
                    ? 'Raport de contrast de minimum 4.5:1 pentru text normal și 7:1 pentru titluri' 
                    : lang === 'fa' 
                    ? 'نسبت کنتراست رنگی حداقل ۴.۵:۱ برای متون و ۷:۱ برای عناوین' 
                    : 'Contrast ratio of at least 4.5:1 for normal text and 7:1 for headers'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                <span>
                  {lang === 'ro' 
                    ? 'Suport complet pentru navigare prin tastatură și focus rings vizibile' 
                    : lang === 'fa' 
                    ? 'پشتیبانی کامل از پیمایش با کیبورد و نشانگرهای فوکوس برجسته' 
                    : 'Full keyboard navigation support with high-visibility focus indicators'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                <span>
                  {lang === 'ro' 
                    ? 'Atribute semantice ARIA pentru elemente interactive și modale' 
                    : lang === 'fa' 
                    ? 'نشانه‌گذاری‌های معنایی ARIA برای سازگاری با صفحه‌خوان‌ها' 
                    : 'Semantic ARIA attributes for screen readers and assistive technology'}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0E9F8E] shrink-0" />
                <span>
                  {lang === 'ro' 
                    ? 'Fonturi scalabile cu suport complet RTL și diacritice' 
                    : lang === 'fa' 
                    ? 'طراحی راست‌به‌چپ (RTL) بومی با تایپوگرافی استاندارد وزیرمتن' 
                    : 'Scalable typography with full multilingual and RTL support'}
                </span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </main>
  );
}
