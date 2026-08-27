'use client';

import React, { use } from 'react';
import { Language } from '@/types';
import { Settings, ShieldCheck, User, Building, Bell } from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

import { formatRoleTitle, formatUnitLabel } from '@/config/formatters';
import { AccountSecurityPanel } from '@/components/auth/AccountSecurityPanel';

export default function SettingsPage(props: { params: Promise<{ lang: Language }> }) {
  const params = use(props.params);
  const { lang } = params;
  const { activeRole, context } = useDemoStore();

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6]">
        <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
          {lang === 'ro' 
            ? 'Setări Cont & Organizație' 
            : lang === 'fa' 
            ? 'تنظیمات حساب کاربری و مجتمع' 
            : 'Account & Organization Settings'}
        </div>
        <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
          {lang === 'ro' ? 'Setări Profil & Permisiuni' : lang === 'fa' ? 'تنظیمات پروفایل و سطوح دسترسی' : 'Settings & Role Permissions'}
        </h1>
        <p className="text-xs text-[#52667A]">
          {lang === 'ro' 
            ? 'Gestiune identitate multi-rol, asociații conectate și preferințe notificări' 
            : lang === 'fa' 
            ? 'مدیریت هویت کاربری چندنقشی، مجتمع‌های متصل و تنظیمات دریافت اعلان‌ها' 
            : 'Manage unified multi-role identity, linked properties, and notification channels'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Identity */}
        <div className="card-proptech p-6 bg-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A43]">
                {lang === 'ro' ? 'Identitate Utilizator Multi-Rol' : lang === 'fa' ? 'هویت یکپارچه چندنقشی کاربر' : 'Unified User Identity'}
              </h3>
              <p className="text-xs text-[#52667A]">
                {lang === 'ro' ? 'Radu Popescu' : lang === 'fa' ? 'علی حسینی' : 'Alex Popescu'} · <span className="ltr-isolate">user@cladora.ro</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F0F4F8] text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">{lang === 'ro' ? 'Rol activ curent:' : lang === 'fa' ? 'نقش فعال فعلی:' : 'Active Role:'}</span>
              <span className="font-bold text-[#0E9F8E]">{formatRoleTitle(activeRole, lang)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">{lang === 'ro' ? 'Asociație principală:' : lang === 'fa' ? 'مجتمع متصل اصلی:' : 'Primary Association:'}</span>
              <span className="font-bold text-[#102A43]">{lang === 'fa' ? 'مجتمع مسکونی آویاتسی ۱۲B' : context.associationName}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">{lang === 'ro' ? 'Unitate rezidențială:' : lang === 'fa' ? 'واحد مسکونی:' : 'Residential Unit:'}</span>
              <span className="font-bold text-[#102A43]">{formatUnitLabel(context.unitNumber || 'Ap. 14', lang)}</span>
            </div>
          </div>
        </div>

        {/* Security & Notifications */}
        <div className="card-proptech p-6 bg-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDF5FF] text-[#2F80ED] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#102A43]">
                {lang === 'ro' ? 'Securitate & Sesiune' : lang === 'fa' ? 'امنیت و نشست‌های فعال' : 'Security & Session'}
              </h3>
              <p className="text-xs text-[#52667A]">
                {lang === 'ro' ? 'Autentificare securizată cu 2FA' : lang === 'fa' ? 'احراز هویت دومرحله‌ای و کنترل دسترسی' : 'Two-factor authentication & session controls'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F0F4F8] text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">{lang === 'ro' ? 'Autentificare în doi pași (2FA):' : lang === 'fa' ? 'احراز هویت دو مرحله‌ای (2FA):' : 'Two-factor authentication:'}</span>
              <span className="font-bold text-[#52667A]">{lang === 'ro' ? 'Vezi starea reală mai jos' : lang === 'fa' ? 'وضعیت واقعی در پایین' : 'See live status below'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">{lang === 'ro' ? 'Notificări avizier pe email:' : lang === 'fa' ? 'ارسال اعلانات تابلو به ایمیل:' : 'Email noticeboard alerts:'}</span>
              <span className="font-bold text-[#102A43]">{lang === 'ro' ? 'Imediat' : lang === 'fa' ? 'فوری' : 'Immediate'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#F6F9FC]">
              <span className="text-[#52667A]">{lang === 'ro' ? 'Alerte scadență întreținere:' : lang === 'fa' ? 'یادآوری مهلت پرداخت شارژ:' : 'Payment due reminder:'}</span>
              <span className="font-bold text-[#102A43]">{lang === 'ro' ? 'Cu 3 zile înainte' : lang === 'fa' ? '۳ روز قبل از سررسید' : '3 days prior'}</span>
            </div>
          </div>
        </div>

        <AccountSecurityPanel lang={lang} />

      </div>

    </div>
  );
}
