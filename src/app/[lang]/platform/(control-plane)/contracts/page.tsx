import React from 'react';
import { FileCheck2, FileText, CheckCircle, Clock } from 'lucide-react';
import type { WorkspaceContract } from '@/types/platform';

export const dynamic = 'force-dynamic';

export default async function PlatformContractsPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const mockContracts: WorkspaceContract[] = [
    {
      id: 'ctr-001',
      customer_workspace_id: 'ws-cld-001',
      plan_id: 'plan-pilot-v1',
      contract_ref: 'CTR-2026-AVIA-001',
      version: 1,
      currency: 'EUR',
      status: 'active',
      start_date: '2026-08-01',
      end_date: '2027-08-01',
      signed_at: '2026-08-20T12:00:00Z',
      activated_at: '2026-08-22T08:00:00Z',
      commercial_terms: {
        base_unit_rate: '0.60',
        committed_units: 48,
        discount_annual_pct: 20,
      },
      created_at: '2026-08-20T10:00:00Z',
    },
    {
      id: 'ctr-002',
      customer_workspace_id: 'ws-cld-002',
      plan_id: 'plan-pm-v1',
      contract_ref: 'CTR-2026-NORD-002',
      version: 1,
      currency: 'EUR',
      status: 'active',
      start_date: '2026-09-01',
      end_date: '2027-09-01',
      signed_at: '2026-08-24T14:00:00Z',
      activated_at: '2026-08-24T15:00:00Z',
      commercial_terms: {
        base_unit_rate: '0.48',
        committed_units: 250,
        billing_frequency: 'monthly_advance',
      },
      created_at: '2026-08-24T11:00:00Z',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Contracte Comerciale & Facturare'
                : isFa
                ? 'قراردادهای تجاری و وضعیت مالی'
                : 'Commercial Contracts & Billing'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Gestiunea termenilor comerciali, monedelor și asocierii planurilor de abonament per spațiu de lucru.'
              : isFa
              ? 'مدیریت شرایط تجاری، ارزهای پایه و ارتباط طرح‌های اشتراک به ازای هر محیط کاری.'
              : 'Management of commercial contract terms, currencies, and subscription plan attachments per workspace.'}
          </p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E3A5A] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isRo ? 'Contracte Active & În Derulare' : isFa ? 'قراردادهای فعال و در جریان' : 'Active Contracts'}
          </span>
          <span className="text-xs text-slate-400 font-mono">Count: {mockContracts.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081320] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E3A5A]">
              <tr>
                <th className="py-3 px-4">Contract Reference</th>
                <th className="py-3 px-4">Workspace ID</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Effective Period</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
              {mockContracts.map((ctr) => (
                <tr key={ctr.id} className="hover:bg-[#12283E] transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{ctr.contract_ref}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Plan ID: {ctr.plan_id}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{ctr.customer_workspace_id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#142A40] text-emerald-300 border border-[#1E3A5A]">
                      {ctr.currency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {ctr.start_date} → {ctr.end_date || 'Ongoing'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {ctr.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">v{ctr.version}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#14324F] hover:bg-[#1E4A73] text-emerald-300 border border-[#1D4A73] transition">
                      View Terms
                    </button>
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
