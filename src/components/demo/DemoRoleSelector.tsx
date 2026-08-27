'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Language, UserRole } from '@/types';
import { 
  ArrowRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { DEMO_ROLES } from '@/data/mockData';
import { useDemoStore } from '@/data/demoStore';

interface DemoRoleSelectorProps {
  lang: Language;
}

export const DemoRoleSelector: React.FC<DemoRoleSelectorProps> = ({ lang }) => {
  const router = useRouter();
  const { setActiveRole, resetDemoData } = useDemoStore();

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    router.push(`/${lang}/demo/app/dashboard`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Disclaimer Banner */}
      <div className="card-proptech p-4 bg-[#EAF8F5] border-[#B2E5DF] flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#087A6E] text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0A6E62]">
              {lang === 'ro' ? 'Mediu Demo Interactiv (Sandbox)' : lang === 'fa' ? 'محیط دموی تعاملی (سندباکس زنده)' : 'Interactive Demo Environment (Sandbox)'}
            </div>
            <div className="text-[11px] text-[#334E68]">
              {lang === 'ro' 
                ? 'Date de test fictive din București (Aviației 12B). Zero autentificare necesară. Poți comuta rolul oricând.'
                : lang === 'fa'
                ? 'داده‌های فرضی و آزمایشی مجتمع مسکونی. بدون نیاز به ثبت‌نام یا لاگین. امکان تغییر نقش در هر لحظه.'
                : 'Fictional Bucharest demo data. Zero login required. Switch roles anytime inside the app shell.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={resetDemoData}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#B2E5DF] text-xs font-bold text-[#0A6E62] hover:bg-[#D5F2ED] transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{lang === 'ro' ? 'Resetează datele demo' : lang === 'fa' ? 'بازنشانی داده‌های دمو' : 'Reset demo data'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
        <span className="text-xs font-bold text-[#087A6E] uppercase tracking-wider bg-[#EAF8F5] px-3 py-1 rounded-full border border-[#B2E5DF]">
          {lang === 'ro' ? 'Alege rolul de testare' : lang === 'fa' ? 'انتخاب نقش در محیط دمو' : 'Choose Your Demo Persona'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-[#102A43]">
          {lang === 'ro' 
            ? 'Cum dorești să experimentezi CLADORA?' 
            : lang === 'fa'
            ? 'مایلید با چه نقشی کلادورا را بیازمایید؟'
            : 'How do you want to explore CLADORA?'}
        </h1>
        <p className="text-sm text-[#334E68]">
          {lang === 'ro'
            ? 'Fiecare rol beneficiază de o vizualizare optimizată cu permisiuni structurate conform Legii 196/2018.'
            : lang === 'fa'
            ? 'هر نقش سازمانی دارای داشبورد، دسترسی‌های اختصاصی و گردش‌کارهای تفکیک‌شده است.'
            : 'Each role configures the application layout, charts, and permitted data boundaries.'}
        </p>
      </div>

      {/* 8 Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DEMO_ROLES.map((role) => (
          <div
            key={role.key}
            className="card-proptech card-proptech-hover p-6 bg-white flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#EAF8F5] text-[#0A6E62]">
                  {role.badge[lang]}
                </span>
              </div>

              <h2 className="text-base font-bold text-[#102A43] mt-4">
                {role.title[lang]}
              </h2>

              <p className="text-xs text-[#334E68] mt-2 leading-relaxed">
                {role.description[lang]}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSelectRole(role.key)}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#102A43] hover:bg-[#087A6E] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>
                {lang === 'ro' 
                  ? 'Intră ca ' + role.title[lang] 
                  : lang === 'fa'
                  ? 'ورود با نقش ' + role.title[lang]
                  : 'Explore as ' + role.title[lang]}
              </span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
