'use client';

import React, { useState } from 'react';
import { Language } from '@/types';
import { Database, ShieldCheck, RefreshCw } from 'lucide-react';
import { Money } from '@/components/ui/Money';
import { formatMoney } from '@/config/currencies';

interface ShadowLedgerDemoProps {
  lang: Language;
}

export const ShadowLedgerDemo: React.FC<ShadowLedgerDemoProps> = ({ lang }) => {
  const [resolved, setResolved] = useState<boolean>(false);

  const discrepancies = [
    {
      id: 'DISC-01',
      unit: lang === 'ro' ? 'Ap. 12' : lang === 'fa' ? 'واحد ۱۲' : 'Apt. 12',
      legacyAmount: 1420.00,
      legacyNote: lang === 'ro' ? 'Sold restanță Excel nespecificat' : lang === 'fa' ? 'مانده بدهی ثبت‌شده بدون مستند در فایل اکسل' : 'Unspecified Excel balance',
      shadowAmount: 1385.40,
      shadowFinding: lang === 'ro' 
        ? 'Penalitate 0.2%/zi calculată eronat după scadență' 
        : lang === 'fa'
        ? 'محاسبه اشتباه جریمه روزانه پس از تاریخ سررسید'
        : 'Penalty cap 0.2%/day miscalculated',
      diffAmount: -34.60,
      status: resolved ? 'RESOLVED' : 'DISCREPANCY',
    },
    {
      id: 'DISC-02',
      unit: lang === 'ro' ? 'Ap. 45' : lang === 'fa' ? 'واحد ۴۵' : 'Apt. 45',
      legacyAmount: 210.00,
      legacyNote: lang === 'ro' ? 'Index contor apă estimat din oficiu' : lang === 'fa' ? 'رقم تخمینی دستی برای کنتور آب' : 'Estimated water meter index',
      shadowAmount: 165.00,
      shadowFinding: lang === 'ro' 
        ? 'OCR foto contor a corectat citirea cu 3 m³' 
        : lang === 'fa'
        ? 'تصویر کنتور و هوش مصنوعی ۳ متر مکعب اضافه مصرف را اصلاح کرد'
        : 'AI Photo OCR corrected 3 m³ over-estimate',
      diffAmount: -45.00,
      status: resolved ? 'RESOLVED' : 'DISCREPANCY',
    },
    {
      id: 'DISC-03',
      unit: lang === 'ro' ? 'Ap. 88' : lang === 'fa' ? 'واحد ۸۸' : 'Apt. 88',
      legacyAmount: 850.00,
      legacyNote: lang === 'ro' ? 'Fond reparații inclus la chiriaș' : lang === 'fa' ? 'درج هزینه صندوق تعمیرات اساسی در فیش مستأجر' : 'Reserve fund billed to tenant',
      shadowAmount: 850.00,
      shadowFinding: lang === 'ro' 
        ? `Re-alocat: ${formatMoney(400, 'RON', lang)} proprietar, ${formatMoney(450, 'RON', lang)} chiriaș` 
        : lang === 'fa'
        ? `تسهیم اصلاحی: ${formatMoney(400, 'RON', lang)} بر عهده مالک، ${formatMoney(450, 'RON', lang)} سهم مستأجر`
        : `Split: ${formatMoney(400, 'RON', lang)} owner, ${formatMoney(450, 'RON', lang)} tenant`,
      diffAmount: 0.00,
      isSplit: true,
      status: resolved ? 'RESOLVED' : 'DISCREPANCY',
    },
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D3DCE6] shadow-elevated relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0E9F8E] uppercase tracking-wider">
            <Database className="w-4 h-4 text-[#0E9F8E]" />
            <span>
              {lang === 'ro' 
                ? 'Simulare Protocol Shadow Ledger (Core C16)' 
                : lang === 'fa'
                ? 'شبیه‌ساز پروتکل دفتر کل موازی (هسته C16)'
                : 'Shadow Ledger Migration Simulator (Core C16)'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' 
              ? 'Reconcilierea Discrepanțelor din Softurile Vechi' 
              : lang === 'fa'
              ? 'کشف و تطبیق خودکار مغایرت‌های سامانه‌های قدیمی'
              : 'Auto-Reconciliation of Legacy System Discrepancies'}
          </h3>
        </div>

        <button
          type="button"
          aria-label={resolved ? (lang === 'ro' ? 'Stare: Reconciliat' : lang === 'fa' ? 'وضعیت: تطبیق‌یافته' : 'Status: Reconciled') : (lang === 'ro' ? 'Reconciliere automată' : lang === 'fa' ? 'اجرای تطبیق خودکار' : 'Run Auto Reconciliation')}
          onClick={() => setResolved(!resolved)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resolved
              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
              : 'bg-[#102A43] hover:bg-[#173F5F] text-white shadow-sm'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resolved ? '' : 'animate-spin'}`} />
          <span>
            {resolved 
              ? (lang === 'ro' ? '✓ Reconciliat (Zero Erori)' : lang === 'fa' ? '✓ تطبیق کامل شد (صفر مغایرت)' : 'Reconciled (Zero Errors)') 
              : (lang === 'ro' ? 'Rezolvă Discrepanțele' : lang === 'fa' ? 'رفع هوشمند مغایرت‌ها' : 'Auto-Reconcile')}
          </span>
        </button>
      </div>

      {/* Discrepancy List */}
      <div className="mt-6 space-y-3">
        {discrepancies.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl border transition-all duration-300 ${
              resolved
                ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                : 'bg-[#F6F9FC] border-[#FDE68A]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#102A43] px-2 py-0.5 rounded bg-white border border-[#E2E8F0]">
                    {item.unit}
                  </span>
                  <span className="text-xs text-[#7B8A9A] font-medium font-mono">
                    {item.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      resolved
                        ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                        : 'bg-[#FFF7E6] text-[#B45309] border border-[#FDE68A]'
                    }`}
                  >
                    {resolved 
                      ? (lang === 'ro' ? 'CORECTAT ÎN GL' : lang === 'fa' ? 'اصلاح در دفتر کل' : 'AUDITED & BALANCED') 
                      : (lang === 'ro' ? 'DISCREPANȚĂ DETECTATĂ' : lang === 'fa' ? 'مغایرت کشف شد' : 'DISCREPANCY')}
                  </span>
                </div>

                <div className="text-xs text-[#52667A] pt-1">
                  <span className="text-[#7B8A9A]">{lang === 'ro' ? 'Stare veche: ' : lang === 'fa' ? 'سوابق پیشین: ' : 'Legacy state: '}</span>
                  <span className="text-[#102A43] font-medium">
                    {item.legacyNote} (<Money amount={item.legacyAmount} currency="RON" locale={lang} />)
                  </span>
                </div>

                <div className="text-xs text-[#0E9F8E] font-medium">
                  <span>{lang === 'ro' ? 'Descoperire CLADORA: ' : lang === 'fa' ? 'نتیجه حسابرسی کلادورا: ' : 'CLADORA Finding: '}</span>
                  <span className="text-[#102A43] font-semibold">{item.shadowFinding}</span>
                </div>
              </div>

              {/* Numbers */}
              <div className="text-end shrink-0">
                <div className="text-sm font-display font-extrabold text-[#102A43]">
                  <Money 
                    amount={resolved ? item.shadowAmount : item.legacyAmount} 
                    currency="RON" 
                    locale={lang} 
                  />
                </div>
                <div className={`text-xs font-mono font-bold ${resolved ? 'text-[#059669]' : 'text-[#B45309]'}`}>
                  {resolved 
                    ? (lang === 'ro' ? 'Reconciliat' : lang === 'fa' ? 'تراز شد' : 'Zero Variance') 
                    : item.isSplit
                    ? (lang === 'ro' ? 'Diferență: 0,00 RON (Split)' : lang === 'fa' ? 'مغایرت: ۰٫۰۰ RON (تفکیک‌شده)' : 'Variance: 0.00 RON (Split)')
                    : `${lang === 'ro' ? 'Diferență:' : lang === 'fa' ? 'مغایرت:' : 'Variance:'} ${formatMoney(item.diffAmount, 'RON', lang)}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-[#F6F9FC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#52667A]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0E9F8E] shrink-0" />
          <span>
            {lang === 'ro' 
              ? 'Rulăm în paralel 1-3 luni fără risc pentru asociație.' 
              : lang === 'fa'
              ? 'فعالیت موازی ۱ تا ۳ دوره مالی بدون هیچ‌گونه ریسک یا اختلال در مجتمع.'
              : 'Parallel run for 1-3 billing cycles with zero association risk.'}
          </span>
        </div>
        <span className="font-mono text-[#059669] font-bold">
          {lang === 'ro' ? 'Risc de migrare: 0%' : lang === 'fa' ? 'ریسک مهاجرت: ۰٪' : 'Migration Risk: 0%'}
        </span>
      </div>
    </div>
  );
};
