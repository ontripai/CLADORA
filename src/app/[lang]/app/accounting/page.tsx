'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { 
  FileSpreadsheet, 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  Lock,
  Plus
} from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';

export default function AccountingPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { journalEntries } = useDemoStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = journalEntries.filter(entry => 
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.documentRef.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C01 — General Ledger & Jurnal Operațiuni
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Contabilitate în Partidă Dublă' : 'Double-Entry General Ledger'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Jurnal imutabil conform Legii 196/2018 · Plan de conturi standardizat
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${lang}/app/accounting/allocations`}
            className="px-4 py-2.5 rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] text-[#102A43] text-xs font-bold transition-all"
          >
            {lang === 'ro' ? 'Vezi Cote & Alocare CPI' : 'View CPI Allocations'}
          </Link>
          <Link
            href={`/${lang}/app/accounting/month-close`}
            className="px-4 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0C8778] text-white text-xs font-bold shadow-sm transition-all"
          >
            {lang === 'ro' ? 'Închidere Lunară' : 'Month-End Close'}
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-proptech p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#7B8A9A] absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ro' ? 'Caută după furnizor, referință sau cont...' : 'Search entries...'}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D3DCE6] text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
          />
        </div>
        <div className="text-xs text-[#52667A] font-medium">
          Afișare: <strong>{filteredEntries.length}</strong> înregistrări contabile
        </div>
      </div>

      {/* Journal Table */}
      <div className="card-proptech bg-white overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F6F9FC] border-b border-[#E2E8F0] text-[#7B8A9A] font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3.5">ID & Dată</th>
              <th className="p-3.5">Referință Document</th>
              <th className="p-3.5">Descriere Operațiune</th>
              <th className="p-3.5">Cont Debit</th>
              <th className="p-3.5">Cont Credit</th>
              <th className="p-3.5 text-right">Sumă (RON)</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-[#F6F9FC]/60 transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-[#102A43] font-mono">{entry.id}</div>
                  <div className="text-[10px] text-[#7B8A9A]">{entry.date}</div>
                </td>
                <td className="p-3.5 font-mono text-[#52667A] font-bold">{entry.documentRef}</td>
                <td className="p-3.5 text-[#102A43] font-medium max-w-xs">{entry.description}</td>
                <td className="p-3.5 font-mono text-xs text-[#0A6E62]">{entry.debitAccount}</td>
                <td className="p-3.5 font-mono text-xs text-[#173F5F]">{entry.creditAccount}</td>
                <td className="p-3.5 text-right font-display font-extrabold text-[#102A43] tabular-nums text-sm">
                  {entry.amount.toFixed(2)}
                </td>
                <td className="p-3.5 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    entry.status === 'POSTED' 
                      ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]' 
                      : 'bg-[#FFF7E6] text-[#B45309] border border-[#FDE68A]'
                  }`}>
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
