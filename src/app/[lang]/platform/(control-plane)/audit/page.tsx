import React from 'react';
import { FileText, Shield, Lock, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PlatformAuditPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const mockAuditEvents = [
    {
      id: 101,
      actor_id: 'auth-usr-001',
      actor_role: 'PLATFORM_SUPER_ADMIN',
      action: 'WORKSPACE_LIFECYCLE_TRANSITION',
      entity_type: 'customer_workspace',
      entity_id: 'ws-cld-001',
      reason: 'Approved pilot onboarding verification',
      occurred_at: '2026-08-22T08:00:00Z',
    },
    {
      id: 102,
      actor_id: 'auth-usr-002',
      actor_role: 'PLATFORM_OPERATIONS',
      action: 'PROVISIONING_RUN_CREATED',
      entity_type: 'provisioning_run',
      entity_id: 'run-001',
      reason: 'Executed standard association provisioning tasks',
      occurred_at: '2026-08-22T07:50:00Z',
    },
    {
      id: 103,
      actor_id: 'auth-usr-001',
      actor_role: 'PLATFORM_SUPER_ADMIN',
      action: 'PLATFORM_ROLE_GRANTED',
      entity_type: 'platform_role_assignment',
      entity_id: 'ra-003',
      reason: 'Assigned PLATFORM_FINANCE role to EMP-FIN-003',
      occurred_at: '2026-08-15T00:00:00Z',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Jurnal de Audit & Integritate Control Plane'
                : isFa
                ? 'دفتر کل ممیزی و رویدادهای امنیتی'
                : 'Control Plane Security & Audit Trail'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Înregistrări append-only de audit cu protecție completă împotriva modificării sau ștergerii.'
              : isFa
              ? 'سوابق تغییرناپذیر ممیزی با حفاظت کامل در برابر حذف یا دستکاری.'
              : 'Append-only audit log records with complete protection against tampering, mutation, or deletion.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#142A40] text-emerald-300 border border-[#1E3A5A] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Append-Only Policy</span>
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#1E3A5A] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isRo ? 'Evenimente Recente de Securitate' : isFa ? 'رویدادهای امنیتی اخیر' : 'Recent Security Events'}
          </span>
          <span className="text-xs text-slate-400 font-mono">Count: {mockAuditEvents.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081320] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1E3A5A]">
              <tr>
                <th className="py-3 px-4">Event ID & Time</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type & ID</th>
                <th className="py-3 px-4">Reason / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
              {mockAuditEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#12283E] transition">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-white text-xs">#{ev.id}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(ev.occurred_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-emerald-300 text-xs">{ev.actor_role}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ev.actor_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#142A40] text-teal-300 border border-[#1E3A5A]">
                      {ev.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    <div>{ev.entity_type}</div>
                    <div className="text-[10px] text-slate-400">{ev.entity_id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate">{ev.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
