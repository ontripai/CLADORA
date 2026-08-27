import React from 'react';
import { Terminal, CheckCircle2, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import type { ProvisioningRun, ProvisioningTask } from '@/types/platform';

export const dynamic = 'force-dynamic';

export default async function PlatformProvisioningPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const mockRuns: Array<ProvisioningRun & { tasks: ProvisioningTask[] }> = [
    {
      id: 'run-001',
      customer_workspace_id: 'ws-cld-001',
      idempotency_key: 'prov-run-avia-001-v1',
      status: 'completed',
      initiated_by: 'usr-cld-ops',
      started_at: '2026-08-22T07:50:00Z',
      completed_at: '2026-08-22T08:00:00Z',
      failure_reason: null,
      evidence_json: {
        tenant_created: true,
        entitlements_applied: true,
        admin_invite_staged: true,
      },
      created_at: '2026-08-22T07:50:00Z',
      tasks: [
        {
          id: 'tsk-001-1',
          run_id: 'run-001',
          task_order: 0,
          task_type: 'create_tenant_mapping',
          status: 'completed',
          attempt_count: 1,
          started_at: '2026-08-22T07:50:00Z',
          completed_at: '2026-08-22T07:51:00Z',
          failure_reason: null,
          result_evidence: { tenant_id: 'ten-avia-001' },
          created_at: '2026-08-22T07:50:00Z',
        },
        {
          id: 'tsk-001-2',
          run_id: 'run-001',
          task_order: 1,
          task_type: 'apply_plan_entitlements',
          status: 'completed',
          attempt_count: 1,
          started_at: '2026-08-22T07:51:00Z',
          completed_at: '2026-08-22T07:53:00Z',
          failure_reason: null,
          result_evidence: { entitlements_count: 8 },
          created_at: '2026-08-22T07:50:00Z',
        },
        {
          id: 'tsk-001-3',
          run_id: 'run-001',
          task_order: 2,
          task_type: 'stage_primary_admin_invite',
          status: 'completed',
          attempt_count: 1,
          started_at: '2026-08-22T07:53:00Z',
          completed_at: '2026-08-22T07:55:00Z',
          failure_reason: null,
          result_evidence: { invite_ref: 'INV-STAGE-001' },
          created_at: '2026-08-22T07:50:00Z',
        },
      ],
    },
    {
      id: 'run-002',
      customer_workspace_id: 'ws-cld-002',
      idempotency_key: 'prov-run-nord-002-v1',
      status: 'running',
      initiated_by: 'usr-cld-ops',
      started_at: '2026-08-26T09:00:00Z',
      completed_at: null,
      failure_reason: null,
      evidence_json: {
        tenant_created: true,
      },
      created_at: '2026-08-26T09:00:00Z',
      tasks: [
        {
          id: 'tsk-002-1',
          run_id: 'run-002',
          task_order: 0,
          task_type: 'create_tenant_mapping',
          status: 'completed',
          attempt_count: 1,
          started_at: '2026-08-26T09:00:00Z',
          completed_at: '2026-08-26T09:02:00Z',
          failure_reason: null,
          result_evidence: { tenant_id: 'ten-pm-002' },
          created_at: '2026-08-26T09:00:00Z',
        },
        {
          id: 'tsk-002-2',
          run_id: 'run-002',
          task_order: 1,
          task_type: 'apply_plan_entitlements',
          status: 'running',
          attempt_count: 1,
          started_at: '2026-08-26T09:02:00Z',
          completed_at: null,
          failure_reason: null,
          result_evidence: {},
          created_at: '2026-08-26T09:00:00Z',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-teal-400" />
            <span>
              {isRo
                ? 'Rulări de Provizionare & Sarcini Idempotente'
                : isFa
                ? 'فرآیندهای آماده‌سازی و وظایف دارای کلید یکتایی'
                : 'Provisioning Runs & Idempotent Tasks'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Execuția ordonată și sigură a pașilor de provizionare cu suport complet de reluare fără efecte secundare duplicate.'
              : isFa
              ? 'اجرای ترتیبی و امن مراحل راه‌اندازی با تضمین عدم تکرار و قابلیت ازسرگیری امن.'
              : 'Ordered, safe execution of workspace provisioning steps with idempotency and resumption guarantees.'}
          </p>
        </div>
      </div>

      {/* Provisioning Runs List */}
      <div className="space-y-4">
        {mockRuns.map((run) => (
          <div
            key={run.id}
            className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1B324D] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-white block">
                  Run: {run.idempotency_key}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Workspace: {run.customer_workspace_id} • Initiator: {run.initiated_by}
                </span>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    run.status === 'completed'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-teal-950/80 text-teal-300 border-teal-500/40'
                  }`}
                >
                  {run.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Execution Tasks Pipeline
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {run.tasks.map((tsk) => (
                  <div
                    key={tsk.id}
                    className="p-3 bg-[#081320] rounded-lg border border-[#1B324D] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">Step {tsk.task_order + 1}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          tsk.status === 'completed'
                            ? 'text-emerald-400 bg-emerald-950/40'
                            : 'text-teal-400 bg-teal-950/40'
                        }`}
                      >
                        {tsk.status}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-white">{tsk.task_type}</div>
                    <div className="text-[10px] text-slate-400">Attempts: {tsk.attempt_count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
