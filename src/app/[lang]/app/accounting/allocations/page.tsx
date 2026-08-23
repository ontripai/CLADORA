'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { Scale, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';
import { AllocationSimulator } from '@/components/interactive/AllocationSimulator';
import { Money } from '@/components/ui/Money';
import { formatPercent } from '@/config/currencies';

export default function AllocationsPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { chargeBreakdown } = useDemoStore();

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C02 — Motor de Alocare & Drepturi 5D' 
              : lang === 'fa' 
              ? 'هسته C02 — موتور تسهیم قانونی و تفکیک حقوق ۵ بعدی' 
              : 'Core C02 — Allocation & 5D Rights Engine'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Alocare Cote & Separare Drepturi' : lang === 'fa' ? 'محاسبه سهم شارژ و تفکیک حقوق' : 'Statutory Allocations & Rights'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Repartizare pe cote-părți indivize (CPI), număr persoane, contoare individuale și suprafață utilă' 
              : lang === 'fa' 
              ? 'تسهیم بر مبنای سهم مشاع (CPI)، تعداد نفرات ساکن، کنتورهای فرعی و متراژ مفید' 
              : 'Repartitions by CPI shares, occupants, submeter consumption, and heated surface'}
          </p>
        </div>
      </div>

      {/* Interactive Simulator */}
      <AllocationSimulator lang={lang} />

      {/* Breakdown Proofs Table */}
      <div className="card-proptech p-6 bg-white space-y-4">
        <h3 className="text-base font-bold text-[#102A43]">
          {lang === 'ro' 
            ? 'Exemplu Alocare pentru Apartamentul 14 (3 Camere — 78 mp)' 
            : lang === 'fa' 
            ? 'نمونه برگه تسهیم هزینه برای واحد ۱۴ (۳ خوابه — ۷۸ متر مربع)' 
            : 'Sample Unit 14 Breakdown (3 Rooms — 78 sqm)'}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F9FC] border-b border-[#E2E8F0] text-[#7B8A9A] font-bold uppercase text-[10px]">
                <th className="p-3 text-start">{lang === 'ro' ? 'Categorie Cheltuială' : lang === 'fa' ? 'سرفصل هزینه' : 'Expense Category'}</th>
                <th className="p-3 text-start">{lang === 'ro' ? 'Factură Sursă' : lang === 'fa' ? 'فاکتور مرجع' : 'Source Invoice'}</th>
                <th className="p-3 text-start">{lang === 'ro' ? 'Total Asociație' : lang === 'fa' ? 'مجموع فاکتور ساختمان' : 'Total Building'}</th>
                <th className="p-3 text-start">{lang === 'ro' ? 'Metodă Alocare' : lang === 'fa' ? 'روش محاسبه' : 'Method'}</th>
                <th className="p-3 text-start">{lang === 'ro' ? 'Cotă Apartament' : lang === 'fa' ? 'سهم واحد' : 'Share Ratio'}</th>
                <th className="p-3 text-end">{lang === 'ro' ? 'Sumă Calculată' : lang === 'fa' ? 'مبلغ سهم واحد' : 'Calculated Share'}</th>
                <th className="p-3 text-center">{lang === 'ro' ? 'Debitor Legal / Plătitor' : lang === 'fa' ? 'مدیون قانونی / پرداخت‌کننده' : 'Legal / Payer'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F8]">
              {chargeBreakdown.map((item) => (
                <tr key={item.id} className="hover:bg-[#F6F9FC]">
                  <td className="p-3 font-bold text-[#102A43] text-start">{item.expenseCategory}</td>
                  <td className="p-3 font-mono text-[#52667A] text-start ltr-isolate">{item.supplierInvoiceRef}</td>
                  <td className="p-3 text-start">
                    <Money amount={item.totalInvoiceAmount} currency={item.currency || 'RON'} locale={lang} />
                  </td>
                  <td className="p-3 font-semibold text-[#0E9F8E] text-start ltr-isolate">{item.allocationMethod}</td>
                  <td className="p-3 font-bold text-start">
                    {formatPercent(item.unitSharePercent, lang, 2)}
                  </td>
                  <td className="p-3 text-end font-bold text-[#102A43]">
                    <Money amount={item.calculatedAmount} currency={item.currency || 'RON'} locale={lang} />
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">
                      {item.legalDebtor === 'OWNER' ? (lang === 'fa' ? 'مالک' : 'OWNER') : item.legalDebtor} / {item.operationalPayer === 'TENANT' ? (lang === 'fa' ? 'مستأجر' : 'TENANT') : (lang === 'fa' ? 'مالک' : 'OWNER')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
