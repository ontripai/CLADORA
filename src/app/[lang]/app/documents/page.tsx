'use client';

import React from 'react';
import { Language } from '@/types';
import { FolderArchive, FileText, Download, ShieldCheck } from 'lucide-react';

export default function DocumentsPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  const docs = [
    { name: 'Statutul Asociației de Proprietari Aviației 12B.pdf', size: '2.4 MB', date: '2024-03-15', category: 'Juridic' },
    { name: 'Regulamentul de Ordine Interioară al Condominiului.pdf', size: '1.1 MB', date: '2025-01-10', category: 'Regulament' },
    { name: 'Contract Mentenanță Ascensoare Otis 2026.pdf', size: '3.8 MB', date: '2026-01-01', category: 'Contracte Furnizori' },
    { name: 'Raport Cenzor Închidere Anuală 2025.pdf', size: '4.2 MB', date: '2026-02-20', category: 'Rapoarte Cenzor' },
  ];

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C10 & C12 — Document Management & Archive
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Registru Documente & Arhivă Condominiu' : 'Document Registry & Archive'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Contracte, procese-verbale AG, rapoarte de cenzor și regulamente interioare
          </p>
        </div>
      </div>

      <div className="card-proptech bg-white overflow-hidden">
        <div className="divide-y divide-[#F0F4F8]">
          {docs.map((doc, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-[#F6F9FC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EAF8F5] text-[#0E9F8E] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#102A43]">{doc.name}</h4>
                  <div className="text-[10px] text-[#7B8A9A]">{doc.category} · {doc.size} · Încărcat la {doc.date}</div>
                </div>
              </div>

              <button
                type="button"
                className="p-2 rounded-lg border border-[#E2E8F0] hover:bg-white text-[#52667A] hover:text-[#0E9F8E] transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Descarcă</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
