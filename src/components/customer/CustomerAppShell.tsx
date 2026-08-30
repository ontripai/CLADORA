"use client";
import Link from "next/link";
import {
  Bell,
  Boxes,
  Building2,
  CreditCard,
  FileSpreadsheet,
  Gauge,
  Gavel,
  Home,
  Landmark,
  LogOut,
  Megaphone,
  ReceiptText,
  RefreshCw,
  Scale,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import type { Language } from "@/types";
import { CladoraBrand } from "@/components/brand/CladoraBrand";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  CustomerContextProvider,
  useCustomerContext,
} from "./CustomerContextProvider";
const copy = {
  ro: {
    dashboard: "Tablou principal",
    accounting: "Registru contabil",
    allocations: "Alocări și drepturi",
    utilities: "Contoare și utilități",
    assets: "Active",
    maintenance: "Mentenanță",
    governance: "Guvernanță",
    meetings: "Ședințe",
    communications: "Comunicări",
    notifications: "Notificări",
    billing: "Facturi și creanțe",
    payments: "Plăți",
    reconciliation: "Reconciliere",
    context: "Context activ",
    empty: "Nu există niciun context activ alocat.",
    secure: "Context verificat de server",
  },
  en: {
    dashboard: "Dashboard",
    accounting: "Accounting ledger",
    allocations: "Allocations & rights",
    utilities: "Meters & utilities",
    assets: "Assets",
    maintenance: "Maintenance",
    governance: "Governance",
    meetings: "Meetings",
    communications: "Communications",
    notifications: "Notifications",
    billing: "Billing & receivables",
    payments: "Payments",
    reconciliation: "Reconciliation",
    context: "Active context",
    empty: "No active assigned context is available.",
    secure: "Server-verified context",
  },
  fa: {
    dashboard: "داشبورد",
    accounting: "دفتر کل حسابداری",
    allocations: "تسهیم و حقوق مالی",
    utilities: "کنتورها و خدمات",
    assets: "دارایی‌ها",
    maintenance: "نگهداری",
    governance: "حاکمیت",
    meetings: "جلسات",
    communications: "ارتباطات",
    notifications: "اعلان‌ها",
    billing: "صورتحساب‌ها و مطالبات",
    payments: "پرداخت‌ها",
    reconciliation: "تطبیق بانکی",
    context: "زمینه فعال",
    empty: "هیچ زمینه تخصیص‌یافته فعالی وجود ندارد.",
    secure: "زمینه تأییدشده توسط سرور",
  },
};
function Shell({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: Language;
}) {
  const state = useCustomerContext(),
    t = copy[lang];
  const accounting = state.dashboard?.modules.includes("accounting"),
    billing = state.dashboard?.modules.includes("billing"),
    payments = state.dashboard?.modules.includes("payments"),
    utilities = state.dashboard?.entitlements.includes("module.utilities"),
    maintenance = state.dashboard?.entitlements.includes("module.maintenance"),
    governance = state.dashboard?.entitlements.includes("module.governance"),
    communications = state.dashboard?.entitlements.includes(
      "module.communications",
    );
  return (
    <div
      className="min-h-screen bg-[#F6F9FC] text-[#102A43]"
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-[#E2E8F0] bg-white px-4 py-2 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/${lang}`} aria-label="CLADORA">
            <CladoraBrand variant="symbol" className="h-8 w-8" />
          </Link>
          <Building2 className="h-4 w-4 shrink-0 text-[#0E9F8E]" />
          <label className="min-w-0 text-xs font-bold">
            <span className="sr-only">{t.context}</span>
            <select
              aria-label={t.context}
              value={state.active?.context_id ?? ""}
              onChange={(e) => state.select(e.target.value)}
              disabled={!state.contexts.length}
              className="max-w-[230px] rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2"
            >
              <option value="">{t.empty}</option>
              {state.contexts.map((c) => (
                <option value={c.context_id} key={c.context_id}>
                  {c.tenant_name} · {c.context_label} · {c.role_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={state.refresh}
            disabled={!state.active || state.loading}
            aria-label="Refresh"
            className="rounded-xl border border-[#E2E8F0] p-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`}
            />
          </button>
          <LanguageSwitcher currentLang={lang} variant="header" />
          <Link
            href={`/${lang}`}
            aria-label="Exit"
            className="rounded-xl border border-[#E2E8F0] p-2"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </header>
      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 border-e border-[#E2E8F0] bg-white p-4 md:block">
          <nav className="space-y-1">
            <Link
              href={`/${lang}/app/dashboard`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
            >
              <Home className="h-4 w-4 text-[#0E9F8E]" />
              {t.dashboard}
            </Link>
            {accounting ? (
              <>
                <Link
                  href={`/${lang}/app/accounting`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#0E9F8E]" />
                  {t.accounting}
                </Link>
                <Link
                  href={`/${lang}/app/accounting/allocations`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <Scale className="h-4 w-4 text-[#0E9F8E]" />
                  {t.allocations}
                </Link>
              </>
            ) : null}
            {utilities ? (
              <Link
                href={`/${lang}/app/meters`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
              >
                <Gauge className="h-4 w-4 text-[#0E9F8E]" />
                {t.utilities}
              </Link>
            ) : null}
            {maintenance ? (
              <>
                <Link
                  href={`/${lang}/app/assets`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <Boxes className="h-4 w-4 text-[#0E9F8E]" />
                  {t.assets}
                </Link>
                <Link
                  href={`/${lang}/app/maintenance`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <Wrench className="h-4 w-4 text-[#0E9F8E]" />
                  {t.maintenance}
                </Link>
              </>
            ) : null}
            {governance ? (
              <>
                <Link
                  href={`/${lang}/app/governance`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <Gavel className="h-4 w-4 text-[#0E9F8E]" />
                  {t.governance}
                </Link>
                <Link
                  href={`/${lang}/app/meetings`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <UsersRound className="h-4 w-4 text-[#0E9F8E]" />
                  {t.meetings}
                </Link>
              </>
            ) : null}
            {communications ? (
              <>
                <Link href={`/${lang}/app/communications`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]">
                  <Megaphone className="h-4 w-4 text-[#0E9F8E]" />
                  {t.communications}
                </Link>
                <Link href={`/${lang}/app/notifications`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]">
                  <Bell className="h-4 w-4 text-[#0E9F8E]" />
                  {t.notifications}
                </Link>
              </>
            ) : null}
            {billing ? (
              <Link
                href={`/${lang}/app/billing`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
              >
                <ReceiptText className="h-4 w-4 text-[#0E9F8E]" />
                {t.billing}
              </Link>
            ) : null}
            {payments ? (
              <>
                <Link
                  href={`/${lang}/app/payments`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <CreditCard className="h-4 w-4 text-[#0E9F8E]" />
                  {t.payments}
                </Link>
                <Link
                  href={`/${lang}/app/reconciliation`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[#102A43] hover:bg-[#F6F9FC]"
                >
                  <Landmark className="h-4 w-4 text-[#0E9F8E]" />
                  {t.reconciliation}
                </Link>
              </>
            ) : null}
          </nav>
          <div className="mt-6 rounded-xl border border-[#B2E5DF] bg-[#EAF8F5] p-3 text-xs text-[#0A6E62]">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4" />
              {t.secure}
            </div>
            {state.active ? (
              <div className="mt-2 text-[11px]">
                {state.active.role_name} · {state.active.scope_type}
              </div>
            ) : null}
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
export function CustomerAppShell({
  children,
  lang,
}: {
  children: React.ReactNode;
  lang: Language;
}) {
  return (
    <CustomerContextProvider>
      <Shell lang={lang}>{children}</Shell>
    </CustomerContextProvider>
  );
}
