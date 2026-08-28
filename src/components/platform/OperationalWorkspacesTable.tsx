"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import type {
  CustomerWorkspace,
  WorkspaceLifecycleStatus,
} from "@/types/platform";

const PAGE_SIZE = 20;
type Locale = "ro" | "en" | "fa";
type LoadState = "loading" | "ready" | "error";

interface WorkspaceResponse {
  workspaces: CustomerWorkspace[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const copy = {
  ro: {
    title: "Spații de lucru înregistrate",
    total: "Total",
    loading: "Se încarcă spațiile de lucru autorizate…",
    emptyTitle: "Nu există spații de lucru disponibile",
    emptyBody:
      "Nu există încă spații de lucru sau operatorul curent nu are o alocare activă.",
    errorTitle: "Spațiile de lucru nu au putut fi încărcate",
    retry: "Reîncearcă",
    previous: "Anterior",
    next: "Următorul",
    page: "Pagina",
    workspace: "Spațiu de lucru și entitate",
    type: "Tip",
    environment: "Mediu",
    status: "Stare ciclu de viață",
    version: "Versiune",
    activated: "Activat la",
  },
  en: {
    title: "Registered workspaces",
    total: "Total",
    loading: "Loading authorized workspaces…",
    emptyTitle: "No workspaces available",
    emptyBody:
      "No workspaces exist yet, or the current operator has no active assignment.",
    errorTitle: "Workspaces could not be loaded",
    retry: "Retry",
    previous: "Previous",
    next: "Next",
    page: "Page",
    workspace: "Workspace & entity",
    type: "Type",
    environment: "Environment",
    status: "Lifecycle status",
    version: "Version",
    activated: "Activated",
  },
  fa: {
    title: "محیط‌های کاری ثبت‌شده",
    total: "مجموع",
    loading: "در حال دریافت محیط‌های کاری مجاز…",
    emptyTitle: "محیط کاری در دسترس نیست",
    emptyBody: "هنوز محیط کاری ایجاد نشده یا کاربر فعلی تخصیص فعال ندارد.",
    errorTitle: "دریافت محیط‌های کاری ناموفق بود",
    retry: "تلاش دوباره",
    previous: "قبلی",
    next: "بعدی",
    page: "صفحه",
    workspace: "محیط کاری و مجموعه",
    type: "نوع",
    environment: "محیط",
    status: "وضعیت چرخه حیات",
    version: "نسخه",
    activated: "تاریخ فعال‌سازی",
  },
} as const;

function statusClass(status: WorkspaceLifecycleStatus) {
  if (status === "ACTIVE")
    return "border-emerald-500/40 bg-emerald-950/80 text-emerald-300";
  if (status === "PROVISIONING")
    return "border-teal-500/40 bg-teal-950/80 text-teal-300";
  if (["CONTRACT_PENDING", "PAYMENT_PENDING", "UNDER_REVIEW"].includes(status))
    return "border-amber-500/40 bg-amber-950/80 text-amber-300";
  if (["SUSPENDED", "PAST_DUE"].includes(status))
    return "border-rose-500/40 bg-rose-950/80 text-rose-300";
  if (["TERMINATED", "ARCHIVED"].includes(status))
    return "border-slate-700 bg-slate-900 text-slate-400";
  return "border-[#1E3A5A] bg-[#142A40] text-slate-300";
}

function localeCode(lang: Locale) {
  return lang === "ro" ? "ro-RO" : lang === "fa" ? "fa-IR" : "en-GB";
}

export function OperationalWorkspacesTable({
  lang: requestedLang,
}: {
  lang: string;
}) {
  const lang: Locale =
    requestedLang === "ro" || requestedLang === "fa" ? requestedLang : "en";
  const labels = copy[lang];
  const [state, setState] = useState<LoadState>("loading");
  const [workspaces, setWorkspaces] = useState<CustomerWorkspace[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/platform/v1/workspaces?limit=${PAGE_SIZE}&offset=${offset}`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as WorkspaceResponse & {
          error?: { code?: string };
        };
        if (!response.ok)
          throw new Error(body.error?.code || `HTTP_${response.status}`);
        return body;
      })
      .then((body) => {
        setWorkspaces(body.workspaces);
        setTotal(body.pagination.total);
        setHasMore(body.pagination.hasMore);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setErrorCode(error instanceof Error ? error.message : "UNKNOWN_ERROR");
        setState("error");
      });
    return () => controller.abort();
  }, [offset, retryCount]);
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section
      className="overflow-hidden rounded-xl border border-[#1E3A5A] bg-[#0F2236] shadow-sm"
      aria-busy={state === "loading"}
    >
      <div className="flex items-center justify-between border-b border-[#1E3A5A] p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {labels.title}
        </h2>
        <span className="font-mono text-xs text-slate-400">
          {labels.total}: {total}
        </span>
      </div>
      {state === "loading" ? (
        <div
          className="flex min-h-56 items-center justify-center gap-2 p-8 text-sm text-slate-300"
          role="status"
        >
          <LoaderCircle
            className="h-5 w-5 animate-spin text-emerald-400"
            aria-hidden="true"
          />
          <span>{labels.loading}</span>
        </div>
      ) : state === "error" ? (
        <div
          className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center"
          role="alert"
        >
          <AlertTriangle
            className="h-7 w-7 text-amber-400"
            aria-hidden="true"
          />
          <div>
            <p className="font-bold text-white">{labels.errorTitle}</p>
            <p className="mt-1 font-mono text-xs text-slate-400">{errorCode}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setState("loading");
              setErrorCode(null);
              setRetryCount((value) => value + 1);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/70 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {labels.retry}
          </button>
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
          <p className="font-bold text-white">{labels.emptyTitle}</p>
          <p className="mt-2 max-w-lg text-xs text-slate-400">
            {labels.emptyBody}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-[#1E3A5A] bg-[#081320] text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {labels.workspace}
                </th>
                <th scope="col" className="px-4 py-3">
                  {labels.type}
                </th>
                <th scope="col" className="px-4 py-3">
                  {labels.environment}
                </th>
                <th scope="col" className="px-4 py-3">
                  {labels.status}
                </th>
                <th scope="col" className="px-4 py-3">
                  {labels.version}
                </th>
                <th scope="col" className="px-4 py-3">
                  {labels.activated}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
              {workspaces.map((workspace) => (
                <tr
                  key={workspace.id}
                  className="transition hover:bg-[#12283E]"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">
                      {workspace.commercial_owner}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      ID: {workspace.id} · Tenant: {workspace.tenant_id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-[#1E3A5A] bg-[#142A40] px-2 py-0.5 font-mono text-[10px] font-bold">
                      {workspace.workspace_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${workspace.environment === "PRODUCTION" ? "border-purple-500/40 bg-purple-950/60 text-purple-300" : "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"}`}
                    >
                      {workspace.environment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusClass(workspace.lifecycle_status)}`}
                    >
                      {workspace.lifecycle_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    v{workspace.version}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {workspace.activated_at
                      ? new Intl.DateTimeFormat(localeCode(lang), {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        }).format(new Date(workspace.activated_at))
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {state === "ready" && total > 0 ? (
        <nav
          className="flex items-center justify-between border-t border-[#1E3A5A] p-4"
          aria-label={`${labels.page} ${pageNumber}`}
        >
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => {
              setState("loading");
              setOffset((value) => Math.max(0, value - PAGE_SIZE));
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[#1E3A5A] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-[#14324F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft
              className="h-4 w-4 rtl:rotate-180"
              aria-hidden="true"
            />
            {labels.previous}
          </button>
          <span className="text-xs text-slate-400">
            {labels.page} {pageNumber} / {pageCount}
          </span>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => {
              setState("loading");
              setOffset((value) => value + PAGE_SIZE);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-[#1E3A5A] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-[#14324F] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {labels.next}
            <ChevronRight
              className="h-4 w-4 rtl:rotate-180"
              aria-hidden="true"
            />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
