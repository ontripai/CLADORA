import React from 'react';
import { KeyRound } from 'lucide-react';
import type { PlatformCustomerAssignment } from '@/types/platform';
import { DemoEnvironmentBanner } from '@/components/platform/DemoEnvironmentBanner';

export const dynamic = 'force-dynamic';

export default async function PlatformAssignmentsPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const mockAssignments: PlatformCustomerAssignment[] = [
    {
      id: 'asg-001',
      platform_user_id: 'usr-cld-ops',
      customer_workspace_id: 'ws-cld-001',
      scope_type: 'workspace',
      scope_id: null,
      valid_from: '2026-08-20T10:00:00Z',
      valid_until: null,
      status: 'active',
      assigned_by: 'auth-usr-001',
      assignment_reason: 'Lead onboarding assignment for Pilot cohort',
      revoked_at: null,
      revoked_by: null,
      revoke_reason: null,
      created_at: '2026-08-20T10:00:00Z',
    },
    {
      id: 'asg-002',
      platform_user_id: 'usr-cld-ops',
      customer_workspace_id: 'ws-cld-002',
      scope_type: 'workspace',
      scope_id: null,
      valid_from: '2026-08-24T11:00:00Z',
      valid_until: null,
      status: 'active',
      assigned_by: 'auth-usr-001',
      assignment_reason: 'Multi-association migration staging assignment',
      revoked_at: null,
      revoked_by: null,
      revoke_reason: null,
      created_at: '2026-08-24T11:00:00Z',
    },
    {
      id: 'asg-003',
      platform_user_id: 'usr-cld-fin',
      customer_workspace_id: 'ws-cld-003',
      scope_type: 'commercial',
      scope_id: null,
      valid_from: '2026-08-26T16:00:00Z',
      valid_until: '2026-12-31T23:59:59Z',
      status: 'active',
      assigned_by: 'auth-usr-001',
      assignment_reason: 'Commercial terms negotiation and quota validation',
      revoked_at: null,
      revoked_by: null,
      revoke_reason: null,
      created_at: '2026-08-26T16:00:00Z',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Alocări Clienți & Domenii de Acces'
                : isFa
                ? 'تخصیص مشتریان و محدوده‌های دسترسی'
                : 'Customer Assignments & Access Scopes'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Conectarea explicită între utilizatorii interni și spațiile de lucru ale clienților conform principiului minimului privilegiu.'
              : isFa
              ? 'اتصال صریح کارشناسان به محیط‌های کاری مشتریان بر اساس اصل حداقل دسترسی مجاز.'
              : 'Explicit binding between internal operators and customer workspaces following least-privilege scoping.'}
          </p>
        </div>
      </div>

      {/* Demo Banner */}
      <DemoEnvironmentBanner lang={lang} />

      {/* Assignments Table */}
      <div className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E3A5A] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isRo ? 'Alocări Active pe Spații de Lucru' : isFa ? 'تخصیص‌های فعال' : 'Active Workspace Assignments'}
          </span>
          <span className="text-xs text-slate-400 font-mono">Count: {mockAssignments.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081320] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E3A5A]">
              <tr>
                <th className="py-3 px-4">Operator User ID</th>
                <th className="py-3 px-4">Workspace Target</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Justification Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
              {mockAssignments.map((asg) => (
                <tr key={asg.id} className="hover:bg-[#12283E] transition">
                  <td className="py-3 px-4 font-mono text-emerald-300">{asg.platform_user_id}</td>
                  <td className="py-3 px-4 font-mono text-white">{asg.customer_workspace_id}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#142A40] text-slate-300 border border-[#1E3A5A]">
                      {asg.scope_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{asg.assignment_reason}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {asg.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-2.5 py-1 rounded text-[11px] font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition">
                      Revoke
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
