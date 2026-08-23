'use client';

import React from 'react';
import { Language } from '@/types';
import { FileCheck2, ShieldCheck, Lock, Search } from 'lucide-react';

export default function AuditTrailPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;

  const logs = [
    { id: 'LOG-88219', timestamp: '2026-10-22 14:30:15', actor: 'Ing. Mihai Voinea (Admin)', action: 'Înregistrare factură furnizor FACT-APA-98214 (4.820,50 RON)', hash: 'sha256:7f8e9a2b1c4d' },
    { id: 'LOG-88218', timestamp: '2026-10-22 11:15:40', actor: 'Elena Popescu (Cenzor)', action: 'Avizare balanță preliminară Septembrie 2026', hash: 'sha256:3a4b5c6d7e8f' },
    { id: 'LOG-88217', timestamp: '2026-10-21 19:15:02', actor: 'Radu Enache (Proprietar Ap. 14)', action: 'Transmitere index contor apă rece (148.20 m³ via Foto OCR)', hash: 'sha256:9c8b7a6f5e4d' },
    { id: 'LOG-88216', timestamp: '2026-10-20 09:45:22', actor: 'Sistem Automat Reconciliere BCR', action: 'Import & Reconciliere 12 plăți întreținere bancare', hash: 'sha256:2b3c4d5e6f7a' }
  ];

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C17 — Immutable Security & Audit Log
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Jurnal de Audit Imutabil' : 'Immutable Audit Trail'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Fiecare operațiune financiară, modificare de cotă și vot este înregistrat cu semnătură de integritate
          </p>
        </div>
      </div>

      <div className="card-proptech bg-white overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F6F9FC] border-b border-[#E2E8F0] text-[#7B8A9A] font-bold uppercase text-[10px]">
              <th className="p-3.5">ID Eveniment</th>
              <th className="p-3.5">Data & Ora (UTC+2)</th>
              <th className="p-3.5">Utilizator / Actor</th>
              <th className="p-3.5">Acțiune Înregistrată</th>
              <th className="p-3.5 text-right font-mono">Hash Integritate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F4F8]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#F6F9FC]">
                <td className="p-3.5 font-mono font-bold text-[#102A43]">{log.id}</td>
                <td className="p-3.5 text-[#52667A]">{log.timestamp}</td>
                <td className="p-3.5 font-semibold text-[#102A43]">{log.actor}</td>
                <td className="p-3.5 text-[#52667A]">{log.action}</td>
                <td className="p-3.5 text-right font-mono text-[11px] text-[#0A6E62] font-bold">{log.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
