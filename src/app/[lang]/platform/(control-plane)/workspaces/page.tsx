import React from 'react';
import { Building2, Plus, AlertCircle } from 'lucide-react';
import type { CustomerWorkspace, WorkspaceLifecycleStatus } from '@/types/platform';
import { DemoEnvironmentBanner } from '@/components/platform/DemoEnvironmentBanner';

export const dynamic = 'force-dynamic';

export default async function PlatformWorkspacesPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  // Demo / Initial Fixtures representing verified platform pipeline
  const mockWorkspaces: CustomerWorkspace[] = [
    {
      id: 'ws-cld-001',
      tenant_id: 'ten-avia-001',
      workspace_type: 'ASSOCIATION',
      lifecycle_status: 'ACTIVE',
      commercial_owner: 'Asociația de Proprietari Aviației 12B',
      environment: 'PILOT',
      version: 4,
      created_at: '2026-08-20T10:00:00Z',
      updated_at: '2026-08-25T14:30:00Z',
      activated_at: '2026-08-22T08:00:00Z',
      suspended_at: null,
      terminated_at: null,
      archived_at: null,
    },
    {
      id: 'ws-cld-002',
      tenant_id: 'ten-pm-002',
      workspace_type: 'PROPERTY_MANAGER',
      lifecycle_status: 'PROVISIONING',
      commercial_owner: 'Nordic Property Administration SRL',
      environment: 'PILOT',
      version: 2,
      created_at: '2026-08-24T11:00:00Z',
      updated_at: '2026-08-26T09:15:00Z',
      activated_at: null,
      suspended_at: null,
      terminated_at: null,
      archived_at: null,
    },
    {
      id: 'ws-cld-003',
      tenant_id: 'ten-land-003',
      workspace_type: 'OWNER_PORTFOLIO',
      lifecycle_status: 'CONTRACT_PENDING',
      commercial_owner: 'Metropolitan Real Estate Assets',
      environment: 'PRODUCTION',
      version: 1,
      created_at: '2026-08-26T16:00:00Z',
      updated_at: '2026-08-26T16:00:00Z',
      activated_at: null,
      suspended_at: null,
      terminated_at: null,
      archived_at: null,
    },
  ];

  const getStatusBadge = (status: WorkspaceLifecycleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'PROVISIONING':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/40';
      case 'CONTRACT_PENDING':
      case 'PAYMENT_PENDING':
      case 'UNDER_REVIEW':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'SUSPENDED':
      case 'PAST_DUE':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      case 'TERMINATED':
      case 'ARCHIVED':
        return 'bg-slate-900 text-slate-400 border-slate-700';
      default:
        return 'bg-[#142A40] text-slate-300 border-[#1E3A5A]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Spații de Lucru Clienți & Ciclu de Viață'
                : isFa
                ? 'محیط‌های کاری مشتریان و چرخه حیات تجاری'
                : 'Customer Workspaces & Lifecycle'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Gestiunea entităților comerciale, mapate la platform.tenants cu tranziții controlate de stare.'
              : isFa
              ? 'مدیریت موجودیت‌های تجاری منطبق بر platform.tenants با انتقال وضعیت کنترل‌شده.'
              : 'Management of commercial workspace entities mapped to platform.tenants with guarded state transitions.'}
          </p>
        </div>

        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 text-xs font-bold cursor-not-allowed opacity-80"
          title="Self-service registration disabled in ENG-009"
        >
          <Plus className="w-4 h-4" />
          <span>{isRo ? 'Nou Spațiu de Lucru' : isFa ? 'ایجاد محیط کاری جدید' : 'New Workspace'}</span>
        </button>
      </div>

      {/* Demo Banner */}
      <DemoEnvironmentBanner lang={lang} />

      {/* Notice on ENG-010 Dependency */}
      <div className="p-4 bg-[#0F2236] rounded-xl border border-[#1E3A5A] flex items-start gap-3 text-xs text-slate-300">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">ENG-010 Guard Directive: </span>
          <span>
            {isRo
              ? 'Tranziția la ACTIVE pentru mediul PRODUCTION este blocată tranzacțional până la implementarea fluxului complet de invitație primară în ENG-010.'
              : isFa
              ? 'انتقال به وضعیت ACTIVE برای محیط‌های PRODUCTION به صورت تراکنشی تا زمان تکمیل فرآیند دعوت اولیه در ENG-010 مسدود است.'
              : 'Transition to ACTIVE for PRODUCTION environments is transaction-blocked until the primary admin onboarding flow is delivered in ENG-010.'}
          </span>
        </div>
      </div>

      {/* Workspaces Table */}
      <div className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E3A5A] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isRo ? 'Listă Spații Înregistrate' : isFa ? 'فهرست محیط‌های کاری ثبت‌شده' : 'Registered Workspaces'}
          </span>
          <span className="text-xs text-slate-400 font-mono">Total: {mockWorkspaces.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081320] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E3A5A]">
              <tr>
                <th className="py-3 px-4">Workspace & Entity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Lifecycle Status</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Activated Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
              {mockWorkspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-[#12283E] transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{ws.commercial_owner}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ID: {ws.id} • Tenant: {ws.tenant_id}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#142A40] text-slate-300 border border-[#1E3A5A]">
                      {ws.workspace_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        ws.environment === 'PRODUCTION'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {ws.environment}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                        ws.lifecycle_status
                      )}`}
                    >
                      {ws.lifecycle_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">v{ws.version}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {ws.activated_at ? new Date(ws.activated_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-[#14324F] hover:bg-[#1E4A73] text-emerald-300 border border-[#1D4A73] transition"
                    >
                      Inspect Details
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
