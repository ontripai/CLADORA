'use client';

import React, { use } from 'react';
import { Language } from '@/types';
import { FolderArchive, FileText, Download, ShieldCheck } from 'lucide-react';
import { getActionLabel } from '@/config/actions';

export default function DocumentsPage(props: { params: Promise<{ lang: Language }> }) {
  const params = use(props.params);
  const { lang } = params;

  const docs = [
    { 
      name: lang === 'ro' ? 'Statutul Asociației de Proprietari Aviației 12B.pdf' : lang === 'fa' ? 'اساسنامه_رسمی_انجمن_مالکان_مجتمع_آویاتسی_12B.pdf' : 'Articles_of_Association_Aviației_12B.pdf', 
      size: '2.4 MB', 
      date: '2024-03-15', 
      category: lang === 'ro' ? 'Juridic' : lang === 'fa' ? 'حقوقی و اساسنامه' : 'Legal' 
    },
    { 
      name: lang === 'ro' ? 'Regulamentul de Ordine Interioară al Condominiului.pdf' : lang === 'fa' ? 'آیین_نامه_انضباطی_و_مقررات_داخلی_مجتمع.pdf' : 'Building_Internal_Regulations_2025.pdf', 
      size: '1.1 MB', 
      date: '2025-01-10', 
      category: lang === 'ro' ? 'Regulament' : lang === 'fa' ? 'آیین‌نامه‌ها' : 'Rules' 
    },
    { 
      name: lang === 'ro' ? 'Contract Mentenanță Ascensoare Otis 2026.pdf' : lang === 'fa' ? 'قرارداد_سرویس_و_نگهداری_آسانسور_اوتیس_2026.pdf' : 'Elevator_Maintenance_Contract_Otis_2026.pdf', 
      size: '3.8 MB', 
      date: '2026-01-01', 
      category: lang === 'ro' ? 'Contracte Furnizori' : lang === 'fa' ? 'قراردادهای پیمانکاران' : 'Vendor Contracts' 
    },
    { 
      name: lang === 'ro' ? 'Raport Cenzor Închidere Anuală 2025.pdf' : lang === 'fa' ? 'گزارش_ممیزی_بازرس_مالی_پایان_دوره_2025.pdf' : 'Annual_Audit_Report_Censor_2025.pdf', 
      size: '4.2 MB', 
      date: '2026-02-20', 
      category: lang === 'ro' ? 'Rapoarte Cenzor' : lang === 'fa' ? 'گزارش‌های بازرس' : 'Audit Reports' 
    },
  ];

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C10 & C12 — Gestiune Documente & Arhivă' 
              : lang === 'fa' 
              ? 'هسته C10 و C12 — بایگانی الکترونیکی اسناد و قراردادهای مجتمع' 
              : 'Core C10 & C12 — Document Management & Archive'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Registru Documente & Arhivă Condominiu' : lang === 'fa' ? 'بایگانی و دفتر اسناد رسمی مجتمع' : 'Document Registry & Archive'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Contracte, procese-verbale AG, rapoarte de cenzor și regulamente interioare' 
              : lang === 'fa' 
              ? 'قراردادهای پیمانکاران، صورت‌جلسات مجامع عمومی، گزارش‌های بازرس مالی و مقررات داخلی مجتمع' 
              : 'Vendor contracts, AGM meeting minutes, auditor reports, and internal house rules'}
          </p>
        </div>
      </div>

      <div className="card-proptech bg-white overflow-hidden">
        <div className="divide-y divide-[#F0F4F8]">
          {docs.map((doc, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#F6F9FC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102A43]">{doc.name}</h4>
                  <div className="text-[10px] text-[#7B8A9A]">
                    {doc.category} · <span className="ltr-isolate">{doc.size}</span> · {lang === 'ro' ? 'Încărcat la' : lang === 'fa' ? 'تاریخ ثبت:' : 'Uploaded on'} <span className="ltr-isolate">{doc.date}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-white text-[#52667A] hover:text-[#0E9F8E] transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{getActionLabel('download', lang)}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
