'use client';

import React from 'react';
import { Language } from '@/types';
import { FileCheck2, ShieldCheck, Lock, Search } from 'lucide-react';
import { formatMoney } from '@/config/currencies';

export default function AuditTrailPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  const logs = [
    { 
      id: 'LOG-88219', 
      timestamp: '2026-10-22 14:30:15', 
      actor: lang === 'ro' ? 'Ing. Mihai Voinea (Admin)' : lang === 'fa' ? 'مهندس رضایی (مدیر ساختمان)' : 'Mihai Voinea (Admin)', 
      action: lang === 'ro' 
        ? `Înregistrare factură furnizor FACT-APA-98214 (${formatMoney(4820.50, 'RON', lang)})` 
        : lang === 'fa'
        ? `ثبت فاکتور تأمین‌کننده FACT-APA-98214 (${formatMoney(4820.50, 'RON', lang)})`
        : `Record supplier invoice FACT-APA-98214 (${formatMoney(4820.50, 'RON', lang)})`, 
      hash: 'sha256:7f8e9a2b1c4d' 
    },
    { 
      id: 'LOG-88218', 
      timestamp: '2026-10-22 11:15:40', 
      actor: lang === 'ro' ? 'Elena Popescu (Cenzor)' : lang === 'fa' ? 'زهرا کاظمی (بازرس مالی)' : 'Elena Popescu (Auditor)', 
      action: lang === 'ro' ? 'Avizare balanță preliminară Septembrie 2026' : lang === 'fa' ? 'تأیید تراز آزمایشی دوره ماه قبل' : 'Audit sign-off for preliminary balance', 
      hash: 'sha256:3a4b5c6d7e8f' 
    },
    { 
      id: 'LOG-88217', 
      timestamp: '2026-10-21 19:15:02', 
      actor: lang === 'ro' ? 'Radu Enache (Proprietar Ap. 14)' : lang === 'fa' ? 'علی حسینی (مالک واحد ۱۴)' : 'Radu Enache (Owner Unit 14)', 
      action: lang === 'ro' ? 'Transmitere index contor apă rece (148.20 m³ via Foto OCR)' : lang === 'fa' ? 'ارسال عکس و شاخص کنتور آب سرد (۱۴۸٫۲۰ متر مکعب)' : 'Cold water meter photo OCR reading (148.20 m³)', 
      hash: 'sha256:9c8b7a6f5e4d' 
    },
    { 
      id: 'LOG-88216', 
      timestamp: '2026-10-20 09:45:22', 
      actor: lang === 'ro' ? 'Sistem Automat Reconciliere BCR' : lang === 'fa' ? 'سامانه هوشمند تطبیق بانکی BCR' : 'BCR Auto-Reconciliation Engine', 
      action: lang === 'ro' ? 'Import & Reconciliere 12 plăți întreținere bancare' : lang === 'fa' ? 'دریافت و تطبیق خودکار ۱۲ تراکنش پرداخت شارژ' : 'Import & reconcile 12 bank statement payments', 
      hash: 'sha256:2b3c4d5e6f7a' 
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            {lang === 'ro' 
              ? 'Nucleul C17 — Jurnal de Securitate & Audit Imutabil' 
              : lang === 'fa' 
              ? 'هسته C17 — لاگ امنیتی و ردپای ممیزی تغییرناپذیر' 
              : 'Core C17 — Immutable Security & Audit Log'}
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Jurnal de Audit Imutabil' : lang === 'fa' ? 'سوابق و ردپای ممیزی تغییرناپذیر' : 'Immutable Audit Trail'}
          </h1>
          <p className="text-xs text-[#52667A]">
            {lang === 'ro' 
              ? 'Fiecare operațiune financiară, modificare de cotă și vot este înregistrat cu semnătură de integritate' 
              : lang === 'fa' 
              ? 'کلیه تراکنش‌های مالی، تغییرات سهام مشاع و آرای مجمع عمومی با امضای دیجیتال و هش تغییرناپذیر ثبت می‌شوند' 
              : 'Every financial entry, quota adjustment, and AGM vote is cryptographically hashed'}
          </p>
        </div>
      </div>

      <div className="card-proptech bg-white overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="bg-[#F6F9FC] border-b border-[#E2E8F0] text-[#7B8A9A] font-bold uppercase text-[10px]">
              <th className="p-3.5 text-start">{lang === 'ro' ? 'ID Eveniment' : lang === 'fa' ? 'شناسه رخداد' : 'Event ID'}</th>
              <th className="p-3.5 text-start">{lang === 'ro' ? 'Data & Ora' : lang === 'fa' ? 'زمان ثبت' : 'Timestamp'}</th>
              <th className="p-3.5 text-start">{lang === 'ro' ? 'Utilizator / Actor' : lang === 'fa' ? 'کاربر / عامل' : 'Actor'}</th>
              <th className="p-3.5 text-start">{lang === 'ro' ? 'Acțiune Înregistrată' : lang === 'fa' ? 'شرح رویداد ممیزی' : 'Action'}</th>
              <th className="p-3.5 text-end font-mono">{lang === 'ro' ? 'Hash Integritate' : lang === 'fa' ? 'هش رمزنگاری' : 'Hash'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#F6F9FC]">
                <td className="p-3.5 font-mono font-bold text-[#102A43] text-start ltr-isolate">{log.id}</td>
                <td className="p-3.5 text-[#52667A] text-start font-mono ltr-isolate">{log.timestamp}</td>
                <td className="p-3.5 font-semibold text-[#102A43] text-start">{log.actor}</td>
                <td className="p-3.5 text-[#52667A] text-start">{log.action}</td>
                <td className="p-3.5 text-end font-mono text-[11px] text-[#0A6E62] font-bold ltr-isolate">{log.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
