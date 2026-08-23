'use client';

import React from 'react';
import { Language } from '@/types';
import { 
  TrendingUp, 
  Plus, 
  Building, 
  Calendar, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';
import { Money } from '@/components/ui/Money';
import { formatPercent } from '@/config/currencies';

export default function PortfolioPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { portfolioProperties } = useDemoStore();

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'CLADORA Portfolio OS — Portofoliu Rezidențial' 
              : lang === 'fa' 
              ? 'سیستم‌عامل پایش سبد املاک CLADORA' 
              : 'CLADORA Portfolio OS'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Portofoliu Proprietăți & Chirii' : lang === 'fa' ? 'مدیریت سبد دارایی‌ها و جریان نقدی اجاره' : 'Property Portfolio & Yields'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Evidență chirii încasate, cheltuieli proprietar vs chiriaș și randament net consolidat' 
              : lang === 'fa' 
              ? 'پایش وصول اجاره‌بها، تفکیک مخارج مالک در برابر مستأجر و محاسبه بازده خالص سرمایه‌گذاری' 
              : 'Consolidated tracking of gross rent, net yields, escrow deposits, and expense splits'}
          </p>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolioProperties.map((prop) => (
          <div key={prop.id} className="card-proptech p-6 bg-white space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">
                  {prop.unit}
                </span>
                <h3 className="text-base font-bold text-[#102A43] mt-1.5">{prop.address}</h3>
                <p className="text-xs text-[#7B8A9A]">
                  {lang === 'fa' 
                    ? (prop.associationName.includes('Titan') ? 'مجتمع مسکونی تیتان پارک' : 'مجتمع مسکونی آویاتسی') 
                    : prop.associationName}
                </p>
              </div>
              <div className="text-end">
                <div className="text-lg font-display font-extrabold text-[#0E9F8E]">
                  <Money amount={prop.monthlyRent} currency={prop.currency as any} locale={lang} minimumFractionDigits={0} maximumFractionDigits={0} />
                </div>
                <div className="text-[10px] text-[#52667A]">
                  {lang === 'ro' ? 'chirie lunară' : lang === 'fa' ? 'اجاره ماهانه' : 'monthly rent'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#F0F4F8] text-center text-xs">
              <div className="p-2 rounded-lg bg-[#F6F9FC]">
                <div className="text-[#7B8A9A] text-[10px]">{lang === 'ro' ? 'Chiriaș' : lang === 'fa' ? 'مستأجر' : 'Tenant'}</div>
                <div className="font-bold text-[#102A43] truncate mt-0.5">{prop.tenantName || (lang === 'fa' ? 'خالی' : 'Vacant')}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#F6F9FC]">
                <div className="text-[#7B8A9A] text-[10px]">{lang === 'ro' ? 'Expirare Contract' : lang === 'fa' ? 'انقضای قرارداد' : 'Lease Expiry'}</div>
                <div className="font-bold text-[#102A43] font-mono mt-0.5 ltr-isolate">{prop.leaseEndDate || 'N/A'}</div>
              </div>
              <div className="p-2 rounded-lg bg-[#F6F9FC]">
                <div className="text-[#7B8A9A] text-[10px]">{lang === 'ro' ? 'Yield Net' : lang === 'fa' ? 'بازده خالص' : 'Net Yield'}</div>
                <div className="font-bold text-[#2F80ED] mt-0.5">{formatPercent(prop.netYieldPercent, lang, 1)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
