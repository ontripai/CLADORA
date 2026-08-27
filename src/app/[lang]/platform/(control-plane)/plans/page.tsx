import React from 'react';
import { Layers, Check } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/platform';
import { DemoEnvironmentBanner } from '@/components/platform/DemoEnvironmentBanner';

export const dynamic = 'force-dynamic';

export default async function PlatformPlansPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  const mockPlans: SubscriptionPlan[] = [
    {
      id: 'plan-pilot-v1',
      plan_code: 'PILOT_ASSOCIATION',
      version: 1,
      display_name: 'Pilot Association Cohort',
      status: 'active',
      feature_catalogue: [
        'double_entry_ledger',
        'law_196_2018_compliance',
        'photo_meter_ocr',
        'shadow_ledger_migration',
        'cenzor_portal',
      ],
      limit_schema: {
        max_buildings: 1,
        max_units: 50,
        max_admins: 3,
        ocr_quota_monthly: 200,
      },
      effective_from: '2026-08-01T00:00:00Z',
      effective_until: null,
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'plan-pm-v1',
      plan_code: 'MANAGER_ENTERPRISE',
      version: 1,
      display_name: 'Management Company Enterprise',
      status: 'active',
      feature_catalogue: [
        'multi_association_console',
        'batch_month_close',
        'work_order_dispatch',
        'vendor_sla_tracking',
        'high_throughput_billing',
      ],
      limit_schema: {
        max_buildings: 50,
        max_units: 2500,
        max_admins: 20,
        ocr_quota_monthly: 5000,
      },
      effective_from: '2026-08-01T00:00:00Z',
      effective_until: null,
      created_at: '2026-08-01T00:00:00Z',
    },
    {
      id: 'plan-land-v1',
      plan_code: 'PORTFOLIO_LANDLORD',
      version: 1,
      display_name: 'Owner Portfolio Cockpit',
      status: 'active',
      feature_catalogue: [
        'lease_tracking',
        '4_way_cost_split',
        'deposit_escrow_accounting',
        'net_yield_analytics',
      ],
      limit_schema: {
        max_buildings: 10,
        max_units: 100,
        max_admins: 5,
        ocr_quota_monthly: 500,
      },
      effective_from: '2026-08-01T00:00:00Z',
      effective_until: null,
      created_at: '2026-08-01T00:00:00Z',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Planuri de Abonament & Cataloage Drepturi'
                : isFa
                ? 'طرح‌های اشتراک و سطوح دسترسی'
                : 'Subscription Plans & Entitlement Schemas'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Definirea versiunilor de planuri, limitelor de capacitate și cataloagelor de funcționalități suportate.'
              : isFa
              ? 'تعریف نسخه‌های معتبر طرح‌ها، سقف ظرفیت‌های مجاز و ماژول‌های فعال پلتفرم.'
              : 'Definition of versioned subscription tiers, capacity quotas, and platform feature catalogues.'}
          </p>
        </div>
      </div>

      {/* Demo Banner */}
      <DemoEnvironmentBanner lang={lang} />

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockPlans.map((plan) => (
          <div
            key={plan.id}
            className="bg-[#0F2236] rounded-xl border border-[#1E3A5A] p-6 flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  {plan.status.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-mono">v{plan.version}</span>
              </div>
              <h2 className="text-base font-bold text-white mb-1">{plan.display_name}</h2>
              <p className="text-xs font-mono text-emerald-400 mb-4">{plan.plan_code}</p>

              {/* Limit Schema */}
              <div className="p-3 bg-[#081320] rounded-lg border border-[#1B324D] text-xs space-y-1.5 mb-4">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Enforced Limits
                </div>
                {Object.entries(plan.limit_schema).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-slate-300">
                    <span className="font-mono text-[11px] text-slate-400">{k}:</span>
                    <span className="font-bold text-white">{String(v)}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="space-y-1.5 mb-6">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  Features Included
                </div>
                {plan.feature_catalogue.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-[11px]">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1E3A5A] text-[11px] text-slate-400 flex items-center justify-between">
              <span>Effective:</span>
              <span className="font-mono text-slate-300">
                {new Date(plan.effective_from).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
