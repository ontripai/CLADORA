"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import type { WorkspaceContract, WorkspaceEntitlement } from "@/types/platform";

const PAGE_SIZE = 20;
type Locale = "ro" | "en" | "fa";
type LoadState = "loading" | "ready" | "error";
type WorkspaceSummary = { id: string; commercial_owner: string; workspace_type: string };
type PlanSummary = { id: string; plan_code: string; display_name: string };
type ContractsResponse = {
  contracts: WorkspaceContract[];
  workspaces: WorkspaceSummary[];
  plans: PlanSummary[];
  entitlements: WorkspaceEntitlement[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

const copy = {
  ro: {
    list: "Contracte autorizate", total: "Total", loading: "Se încarcă contractele și drepturile autorizate…",
    emptyTitle: "Nu există contracte disponibile", emptyBody: "Nu există încă contracte sau operatorul nu are o alocare comercială activă.",
    errorTitle: "Contractele nu au putut fi încărcate", retry: "Reîncearcă", contract: "Contract", workspace: "Spațiu de lucru",
    plan: "Plan", period: "Perioadă", status: "Stare", details: "Detalii contract", entitlements: "Drepturi active",
    noEntitlements: "Nu există drepturi asociate acestui spațiu de lucru.", terms: "Termeni comerciali",
    noTerms: "Nu există termeni comerciali suplimentari.", previous: "Anterior", next: "Următorul", page: "Pagina", override: "Suprascriere temporară",
  },
  en: {
    list: "Authorized contracts", total: "Total", loading: "Loading authorized contracts and entitlements…",
    emptyTitle: "No contracts available", emptyBody: "No contracts exist yet, or the operator has no active commercial assignment.",
    errorTitle: "Contracts could not be loaded", retry: "Retry", contract: "Contract", workspace: "Workspace", plan: "Plan",
    period: "Period", status: "Status", details: "Contract details", entitlements: "Active entitlements",
    noEntitlements: "No entitlements are associated with this workspace.", terms: "Commercial terms",
    noTerms: "No additional commercial terms are recorded.", previous: "Previous", next: "Next", page: "Page", override: "Temporary override",
  },
  fa: {
    list: "قراردادهای مجاز", total: "مجموع", loading: "در حال دریافت قراردادها و سهمیه‌های مجاز…",
    emptyTitle: "قراردادی در دسترس نیست", emptyBody: "هنوز قراردادی ثبت نشده یا کاربر تخصیص تجاری فعال ندارد.",
    errorTitle: "دریافت قراردادها ناموفق بود", retry: "تلاش دوباره", contract: "قرارداد", workspace: "محیط کاری", plan: "طرح",
    period: "دوره", status: "وضعیت", details: "جزئیات قرارداد", entitlements: "سهمیه‌ها و دسترسی‌های فعال",
    noEntitlements: "برای این محیط کاری سهمیه‌ای ثبت نشده است.", terms: "شرایط تجاری", noTerms: "شرایط تجاری دیگری ثبت نشده است.",
    previous: "قبلی", next: "بعدی", page: "صفحه", override: "مقدار موقت جایگزین",
  },
} as const;

function entitlementValue(item: WorkspaceEntitlement) {
  if (item.override_value_json !== null) return JSON.stringify(item.override_value_json);
  if (item.value_type === "numeric") return String(item.numeric_value ?? "—");
  if (item.value_type === "boolean") return item.boolean_value ? "✓" : "—";
  if (item.value_type === "string") return item.text_value ?? "—";
  return item.json_value === null ? "—" : JSON.stringify(item.json_value);
}

export function OperationalContractsPanel({ lang: requestedLang }: { lang: string }) {
  const lang: Locale = requestedLang === "ro" || requestedLang === "fa" ? requestedLang : "en";
  const labels = copy[lang];
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<ContractsResponse | null>(null);
  const [offset, setOffset] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/platform/v1/contracts?limit=${PAGE_SIZE}&offset=${offset}`, {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as ContractsResponse & { error?: { code?: string } };
        if (!response.ok) throw new Error(body.error?.code || `HTTP_${response.status}`);
        return body;
      })
      .then((body) => {
        setData(body);
        setSelectedId((current) => current && body.contracts.some((item) => item.id === current) ? current : body.contracts[0]?.id ?? null);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorCode(error instanceof Error ? error.message : "UNKNOWN_ERROR");
        setState("error");
      });
    return () => controller.abort();
  }, [offset, retryCount]);

  const workspaces = useMemo(() => new Map(data?.workspaces.map((item) => [item.id, item]) ?? []), [data?.workspaces]);
  const plans = useMemo(() => new Map(data?.plans.map((item) => [item.id, item]) ?? []), [data?.plans]);
  const selected = data?.contracts.find((item) => item.id === selectedId) ?? null;
  const selectedEntitlements = data?.entitlements.filter((item) => item.customer_workspace_id === selected?.customer_workspace_id) ?? [];
  const total = data?.pagination.total ?? 0;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (state === "loading") return (
    <div role="status" className="flex min-h-72 items-center justify-center gap-2 rounded-xl border border-[#1E3A5A] bg-[#0F2236] p-8 text-sm text-slate-300">
      <LoaderCircle className="h-5 w-5 animate-spin text-emerald-400" aria-hidden="true" />{labels.loading}
    </div>
  );
  if (state === "error") return (
    <div role="alert" className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border border-[#1E3A5A] bg-[#0F2236] p-8 text-center">
      <AlertTriangle className="h-7 w-7 text-amber-400" aria-hidden="true" />
      <div><p className="font-bold text-white">{labels.errorTitle}</p><p className="mt-1 font-mono text-xs text-slate-400">{errorCode}</p></div>
      <button type="button" onClick={() => { setState("loading"); setErrorCode(null); setRetryCount((value) => value + 1); }} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/70 px-3 py-2 text-xs font-bold text-emerald-300">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />{labels.retry}
      </button>
    </div>
  );
  if (!data || data.contracts.length === 0) return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-[#1E3A5A] bg-[#0F2236] p-8 text-center">
      <FileText className="h-8 w-8 text-slate-500" aria-hidden="true" /><p className="mt-3 font-bold text-white">{labels.emptyTitle}</p><p className="mt-2 max-w-lg text-xs text-slate-400">{labels.emptyBody}</p>
    </div>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
      <section className="overflow-hidden rounded-xl border border-[#1E3A5A] bg-[#0F2236] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1E3A5A] p-4"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">{labels.list}</h2><span className="font-mono text-xs text-slate-400">{labels.total}: {total}</span></div>
        <div className="overflow-x-auto"><table className="w-full text-start text-xs"><thead className="border-b border-[#1E3A5A] bg-[#081320] text-[10px] uppercase tracking-wider text-slate-400"><tr><th scope="col" className="px-4 py-3">{labels.contract}</th><th scope="col" className="px-4 py-3">{labels.workspace}</th><th scope="col" className="px-4 py-3">{labels.plan}</th><th scope="col" className="px-4 py-3">{labels.period}</th><th scope="col" className="px-4 py-3">{labels.status}</th></tr></thead>
          <tbody className="divide-y divide-[#1E3A5A] text-slate-300">{data.contracts.map((contract) => {
            const workspace = workspaces.get(contract.customer_workspace_id);
            const plan = contract.plan_id ? plans.get(contract.plan_id) : null;
            const active = contract.id === selectedId;
            return <tr key={contract.id} className={active ? "bg-emerald-950/30" : "hover:bg-[#12283E]"}><td className="px-4 py-3"><button type="button" onClick={() => setSelectedId(contract.id)} className="text-start font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">{contract.contract_ref}</button><div className="font-mono text-[10px] text-slate-400">v{contract.version} · {contract.currency}</div></td><td className="px-4 py-3"><div className="font-semibold text-slate-200">{workspace?.commercial_owner ?? contract.customer_workspace_id}</div><div className="font-mono text-[10px] text-slate-400">{workspace?.workspace_type ?? "—"}</div></td><td className="px-4 py-3"><div>{plan?.display_name ?? "—"}</div><div className="font-mono text-[10px] text-emerald-400">{plan?.plan_code ?? "—"}</div></td><td className="whitespace-nowrap px-4 py-3">{contract.start_date} → {contract.end_date ?? "—"}</td><td className="px-4 py-3"><span className="rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">{contract.status.toUpperCase()}</span></td></tr>;
          })}</tbody></table></div>
        <nav className="flex items-center justify-between border-t border-[#1E3A5A] p-4" aria-label={`${labels.page} ${pageNumber}`}><button type="button" disabled={offset === 0} onClick={() => { setState("loading"); setOffset((value) => Math.max(0, value - PAGE_SIZE)); }} className="inline-flex items-center gap-1 rounded-lg border border-[#1E3A5A] px-3 py-2 text-xs font-bold disabled:opacity-40"><ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{labels.previous}</button><span className="text-xs text-slate-400">{labels.page} {pageNumber} / {pageCount}</span><button type="button" disabled={!data.pagination.hasMore} onClick={() => { setState("loading"); setOffset((value) => value + PAGE_SIZE); }} className="inline-flex items-center gap-1 rounded-lg border border-[#1E3A5A] px-3 py-2 text-xs font-bold disabled:opacity-40">{labels.next}<ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /></button></nav>
      </section>
      <aside className="rounded-xl border border-[#1E3A5A] bg-[#0F2236] p-5 shadow-sm"><h2 className="text-sm font-black text-white">{labels.details}</h2>{selected ? <div className="mt-4 space-y-5"><div><p className="font-mono text-xs font-bold text-emerald-300">{selected.contract_ref}</p><p className="mt-1 text-xs text-slate-400">{workspaces.get(selected.customer_workspace_id)?.commercial_owner}</p></div><section><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.entitlements}</h3>{selectedEntitlements.length ? <dl className="space-y-2">{selectedEntitlements.map((item) => <div key={item.id} className="rounded-lg border border-[#1B324D] bg-[#081320] p-3"><div className="flex items-start justify-between gap-3"><dt className="break-all font-mono text-[11px] text-slate-300">{item.entitlement_key}</dt><dd className="max-w-[45%] break-all text-end text-xs font-bold text-white">{entitlementValue(item)}</dd></div>{item.override_value_json !== null ? <p className="mt-2 text-[10px] text-amber-300">{labels.override} · {item.override_expires_at ?? "—"}</p> : null}</div>)}</dl> : <p className="text-xs text-slate-400">{labels.noEntitlements}</p>}</section><section><h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{labels.terms}</h3>{Object.keys(selected.commercial_terms).length ? <dl className="space-y-2 rounded-lg border border-[#1B324D] bg-[#081320] p-3">{Object.entries(selected.commercial_terms).map(([key, value]) => <div key={key} className="flex items-start justify-between gap-3 text-xs"><dt className="break-all font-mono text-slate-400">{key}</dt><dd className="max-w-[48%] break-all text-end font-semibold text-slate-200">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl> : <p className="text-xs text-slate-400">{labels.noTerms}</p>}</section></div> : null}</aside>
    </div>
  );
}
