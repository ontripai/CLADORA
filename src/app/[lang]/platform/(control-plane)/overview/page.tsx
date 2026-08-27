import React from 'react';
import { Shield, Building2, Terminal, FileCheck2, Lock, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PlatformOverviewPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;

  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            {isRo
              ? 'Consola Centrală a Platformei (Control Plane)'
              : isFa
              ? 'کنسول مدیریت پلتفرم (Control Plane)'
              : 'Platform Control Plane Overview'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Infrastructură sigură de control comercial, roluri interne, drepturi și provizionare (ADR-CLD-023).'
              : isFa
              ? 'زیرساخت امن مدیریت تجاری، نقش‌های داخلی، حقوق دسترسی و آماده‌سازی سیستم‌ها (ADR-CLD-023).'
              : 'Secure commercial control plane, internal roles, entitlements, and workspace provisioning (ADR-CLD-023).'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <Lock className="w-3.5 h-3.5" />
            <span>Customer Separation: Active</span>
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0F2236] rounded-xl border border-[#1E3A5A] shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isRo ? 'Spații de Lucru' : isFa ? 'محیط‌های کاری' : 'Workspaces'}
            </span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">12</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>PILOT & Commercial Pipeline</span>
          </div>
        </div>

        <div className="p-5 bg-[#0F2236] rounded-xl border border-[#1E3A5A] shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isRo ? 'Rulări Provizionare' : isFa ? 'فرآیندهای آماده‌سازی' : 'Provisioning Runs'}
            </span>
            <Terminal className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">8</div>
          <div className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
            <span>Idempotent task foundation</span>
          </div>
        </div>

        <div className="p-5 bg-[#0F2236] rounded-xl border border-[#1E3A5A] shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isRo ? 'Contracte & Planuri' : isFa ? 'قراردادها و طرح‌ها' : 'Contracts & Plans'}
            </span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">3</div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
            <span>Versioned subscription tiers</span>
          </div>
        </div>

        <div className="p-5 bg-[#0F2236] rounded-xl border border-[#1E3A5A] shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isRo ? 'Integritate Audit' : isFa ? 'صحت ممیزی' : 'Audit Integrity'}
            </span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100%</div>
          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
            <span>Append-only ledger active</span>
          </div>
        </div>
      </div>

      {/* Architecture & Governance Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-[#0F2236] rounded-xl border border-[#1E3A5A] space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{isRo ? 'Regulă de Autorizare ADR-CLD-023' : isFa ? 'قاعده اعتبارسنجی و دسترسی ADR-CLD-023' : 'ADR-CLD-023 Authorization Rule'}</span>
          </h2>
          <div className="p-4 bg-[#081320] rounded-lg border border-[#1B324D] font-mono text-xs text-emerald-300 space-y-1">
            <p className="font-bold text-white">Platform Access Decision =</p>
            <p className="pl-4">Role [PLATFORM_*]</p>
            <p className="pl-4">+ Customer Assignment [workspace_id]</p>
            <p className="pl-4">+ Resource Scope [scope_type]</p>
            <p className="pl-4">+ Entitlement Check [quota_limit]</p>
            <p className="pl-4">+ Time Constraint [valid_from..valid_until]</p>
            <p className="pl-4">+ Workspace Lifecycle State [ACTIVE / PILOT]</p>
          </div>
          <p className="text-xs text-slate-300">
            {isRo
              ? 'Rolurile platformei nu oferă acces nelimitat la datele private ale clienților. Fiecare accesare necesită o alocare explicită și este auditată.'
              : isFa
              ? 'نقش‌های پلتفرم به تنهایی دسترسی عمومی به اطلاعات خصوصی مشتریان ایجاد نمی‌کنند. هر دسترسی مستلزم تخصیص معتبر و دارای ثبت ممیزی است.'
              : 'Platform roles alone do not grant unrestricted customer data access. Every operation requires explicit customer assignment and immutable audit recording.'}
          </p>
        </div>

        <div className="p-6 bg-[#0F2236] rounded-xl border border-[#1E3A5A] space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span>{isRo ? 'Module de Control Activ' : isFa ? 'ماژول‌های فعال کنترلی' : 'Active Control Modules'}</span>
          </h2>
          <div className="space-y-2">
            <Link
              href={`/${lang}/platform/workspaces`}
              className="p-3 bg-[#081320] hover:bg-[#12283E] rounded-lg border border-[#1B324D] flex items-center justify-between transition group"
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                  {isRo ? 'Gestiune Spații de Lucru & Ciclu de Viață' : isFa ? 'مدیریت محیط‌های کاری و چرخه حیات' : 'Workspaces & Lifecycle State Machine'}
                </span>
                <span className="text-[11px] text-slate-400">
                  LEAD → PROVISIONING → ACTIVE → ARCHIVED
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-300" />
            </Link>

            <Link
              href={`/${lang}/platform/provisioning`}
              className="p-3 bg-[#081320] hover:bg-[#12283E] rounded-lg border border-[#1B324D] flex items-center justify-between transition group"
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                  {isRo ? 'Rulări Idempotente de Provizionare' : isFa ? 'آماده‌سازی خودکار و بدون تکرار' : 'Idempotent Provisioning Runs'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Ordered task execution with resumption guarantees
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-300" />
            </Link>

            <Link
              href={`/${lang}/platform/audit`}
              className="p-3 bg-[#081320] hover:bg-[#12283E] rounded-lg border border-[#1B324D] flex items-center justify-between transition group"
            >
              <div>
                <span className="text-xs font-bold text-white block group-hover:text-emerald-300">
                  {isRo ? 'Jurnal Audit & Securitate Control Plane' : isFa ? 'ثبت تغییرات امنیتی و ممیزی' : 'Security & Control Plane Audit Trail'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Tamper-evident before/after tracking
                </span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
