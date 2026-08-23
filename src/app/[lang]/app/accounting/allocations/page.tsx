'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/types';
import { Scale, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';
import { useDemoStore } from '@/data/demoStore';
import { AllocationSimulator } from '@/components/interactive/AllocationSimulator';

export default function AllocationsPage({ params }: { params: { lang: Language } }) {
  const { lang } = params;
  const { chargeBreakdown } = useDemoStore();

  return (
    <div className="space-y-6">
      
      <div className="card-proptech p-6 bg-white border-[#D3DCE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0E9F8E] uppercase tracking-wider">
            Nucleul C02 — Allocation & 5D Rights Engine
          </div>
          <h1 className="text-2xl font-display font-extrabold text-[#102A43] mt-1">
            {lang === 'ro' ? 'Alocare Cote & Separare Drepturi' : 'Statutory Allocations & Rights'}
          </h1>
          <p className="text-xs text-[#52667A]">
            Repartizare pe cote-părți indivize (CPI), număr persoane, contoare individuale și suprafață utilă
          </p>
        </div>
      </div>

      {/* Interactive Simulator */}
      <AllocationSimulator lang={lang} />

      {/* Breakdown Proofs Table */}
      <div className="card-proptech p-6 bg-white space-y-4">
        <h3 className="text-base font-bold text-[#102A43]">
          {lang === 'ro' ? 'Exemplu Alocare pentru Apartamentul 14 (3 Camere — 78 mp)' : 'Sample Unit 14 Breakdown'}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F6F9FC] border-b border-[#E2E8F0] text-[#7B8A9A] font-bold uppercase text-[10px]">
                <th className="p-3">Categorie Cheltuială</th>
                <th className="p-3">Factură Sursă</th>
                <th className="p-3">Total Asociație</th>
                <th className="p-3">Metodă Alocare</th>
                <th className="p-3">Cotă Apartament</th>
                <th className="p-3 text-right">Sumă Calculată</th>
                <th className="p-3 text-center">Debitor Legal / Plătitor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F4F8]">
              {chargeBreakdown.map((item) => (
                <tr key={item.id} className="hover:bg-[#F6F9FC]">
                  <td className="p-3 font-bold text-[#102A43]">{item.expenseCategory}</td>
                  <td className="p-3 font-mono text-[#52667A]">{item.supplierInvoiceRef}</td>
                  <td className="p-3 font-mono tabular-nums">{item.totalInvoiceAmount.toFixed(2)} RON</td>
                  <td className="p-3 font-semibold text-[#0E9F8E]">{item.allocationMethod}</td>
                  <td className="p-3 font-bold tabular-nums">{item.unitSharePercent}%</td>
                  <td className="p-3 text-right font-bold text-[#102A43] tabular-nums">{item.calculatedAmount.toFixed(2)} RON</td>
                  <td className="p-3 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAF8F5] text-[#0A6E62]">
                      {item.legalDebtor} / {item.operationalPayer}
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
