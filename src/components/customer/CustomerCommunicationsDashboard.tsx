"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCustomerContext } from "./CustomerContextProvider";
type View =
  | "channels"
  | "announcements"
  | "posts"
  | "comments"
  | "polls"
  | "options"
  | "results"
  | "notifications"
  | "links";
type Payload = {
  total: number;
  rows: Record<string, unknown>[];
  summary: {
    channels: number;
    published_posts: number;
    open_polls: number;
    unread_notifications: number;
  };
};
const views: View[] = [
  "channels",
  "announcements",
  "posts",
  "comments",
  "polls",
  "options",
  "results",
  "notifications",
  "links",
];
const hidden = new Set([
  "membership_id",
  "author_membership_id",
  "payload",
  "action_url",
  "party_id",
  "object_path",
  "attachment_path",
  "recipient_id",
  "respondent_id",
  "user_id",
  "email",
  "phone",
  "before_snapshot",
  "after_snapshot",
]);
const copy = {
  en: {
    title: "Communications, Polls & Notifications",
    sub: "Authorized notices, channel content, aggregate poll results and your own notifications.",
    channels: "Channels",
    announcements: "Announcements",
    posts: "Posts",
    comments: "Comments",
    polls: "Polls",
    options: "Options",
    results: "Results",
    notifications: "Notifications",
    links: "Related records",
    search: "Search authorized communications",
    all: "All",
    status: "Status",
    from: "From",
    to: "To",
    refresh: "Refresh",
    loading: "Loading authorized communications…",
    empty: "No communications are visible in this context.",
    error: "Communications could not be loaded.",
    readonly: "Read-only · confidential responses aggregated",
    details: "Details",
    close: "Close",
    published: "Published posts",
    openPolls: "Open polls",
    unread: "Unread notifications",
    date: "Date",
    subject: "Subject",
    channel: "Channel / scope",
    result: "Result",
    state: "Status",
  },
  ro: {
    title: "Comunicări, sondaje și notificări",
    sub: "Anunțuri autorizate, conținutul canalelor, rezultate agregate și notificările proprii.",
    channels: "Canale",
    announcements: "Anunțuri",
    posts: "Postări",
    comments: "Comentarii",
    polls: "Sondaje",
    options: "Opțiuni",
    results: "Rezultate",
    notifications: "Notificări",
    links: "Înregistrări asociate",
    search: "Caută în comunicările autorizate",
    all: "Toate",
    status: "Stare",
    from: "De la",
    to: "Până la",
    refresh: "Reîncarcă",
    loading: "Se încarcă comunicările autorizate…",
    empty: "Nu există comunicări vizibile în acest context.",
    error: "Comunicările nu au putut fi încărcate.",
    readonly: "Doar citire · răspunsurile confidențiale sunt agregate",
    details: "Detalii",
    close: "Închide",
    published: "Postări publicate",
    openPolls: "Sondaje deschise",
    unread: "Notificări necitite",
    date: "Dată",
    subject: "Subiect",
    channel: "Canal / domeniu",
    result: "Rezultat",
    state: "Stare",
  },
  fa: {
    title: "ارتباطات، نظرسنجی‌ها و اعلان‌ها",
    sub: "اطلاعیه‌های مجاز، محتوای کانال‌ها، نتایج تجمیعی و اعلان‌های شخصی شما.",
    channels: "کانال‌ها",
    announcements: "اطلاعیه‌ها",
    posts: "پست‌ها",
    comments: "نظرها",
    polls: "نظرسنجی‌ها",
    options: "گزینه‌ها",
    results: "نتایج",
    notifications: "اعلان‌ها",
    links: "سوابق مرتبط",
    search: "جستجوی ارتباطات مجاز",
    all: "همه",
    status: "وضعیت",
    from: "از",
    to: "تا",
    refresh: "بازخوانی",
    loading: "در حال دریافت ارتباطات مجاز…",
    empty: "در این زمینه ارتباطی قابل مشاهده نیست.",
    error: "دریافت ارتباطات ناموفق بود.",
    readonly: "فقط خواندنی · پاسخ‌های محرمانه تجمیع شده‌اند",
    details: "جزئیات",
    close: "بستن",
    published: "پست‌های منتشرشده",
    openPolls: "نظرسنجی‌های باز",
    unread: "اعلان‌های خوانده‌نشده",
    date: "تاریخ",
    subject: "موضوع",
    channel: "کانال / دامنه",
    result: "نتیجه",
    state: "وضعیت",
  },
} as const;
const show = (v: unknown) =>
  v == null || v === ""
    ? "—"
    : typeof v === "object"
      ? JSON.stringify(v)
      : String(v);
const date = (v: unknown, l: string) =>
  v
    ? new Intl.DateTimeFormat(
        l === "fa" ? "fa-IR" : l === "ro" ? "ro-RO" : "en-US",
      ).format(new Date(String(v)))
    : "—";
export function CustomerCommunicationsDashboard({
  lang,
  initialView,
}: {
  lang: string;
  initialView: View;
}) {
  const t = copy[lang === "fa" ? "fa" : lang === "ro" ? "ro" : "en"],
    { active } = useCustomerContext();
  const [view, setView] = useState<View>(initialView),
    [data, setData] = useState<Payload | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [offset, setOffset] = useState(0),
    [draft, setDraft] = useState(""),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [selected, setSelected] = useState<Record<string, unknown> | null>(null),
    [nonce, setNonce] = useState(0);
  const load = useCallback(async () => {
    if (!active) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams({
        context_id: active.context_id,
        view,
        limit: "20",
        offset: String(offset),
      });
      if (query) p.set("query", query);
      if (status) p.set("status", status);
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      const r = await fetch(`/api/customer/v1/communications?${p}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [active, view, offset, query, status, from, to, t.error]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 150);
    return () => clearTimeout(timer);
  }, [load, nonce]);
  return (
    <div className="space-y-5">
      <header className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E9F8E]">
              <Megaphone className="h-4 w-4" />
              C11 · Communications
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-[#102A43]">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-[#52667A]">{t.sub}</p>
          </div>
          <div className="h-fit rounded-xl border border-[#B2E5DF] bg-[#EAF8F5] px-3 py-2 text-xs font-bold text-[#0A6E62]">
            <ShieldCheck className="me-2 inline h-4 w-4" />
            {t.readonly}
          </div>
        </div>
      </header>
      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => {
              setView(v);
              setOffset(0);
              setStatus("");
              setSelected(null);
            }}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${view === v ? "bg-[#0E9F8E] text-white" : "border bg-white text-[#334E68]"}`}
          >
            {t[v]}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setQuery(draft.trim());
        }}
        className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-6"
      >
        <label className="relative md:col-span-2">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-[#7B8A9A]" />
          <span className="sr-only">{t.search}</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.search}
            className="w-full rounded-xl border py-2 pe-3 ps-9 text-sm"
          />
        </label>
        <input
          aria-label={t.status}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setOffset(0);
          }}
          placeholder={`${t.all} · ${t.status}`}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          type="date"
          aria-label={t.from}
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setOffset(0);
          }}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <input
          type="date"
          aria-label={t.to}
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setOffset(0);
          }}
          className="rounded-xl border px-3 py-2 text-sm"
        />
        <button
          type="button"
          aria-label={t.refresh}
          onClick={() => setNonce((n) => n + 1)}
          className="rounded-xl border p-2"
        >
          <RefreshCw className="mx-auto h-4 w-4" />
        </button>
      </form>
      {data?.summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label={t.channels} value={data.summary.channels} />
          <Metric label={t.published} value={data.summary.published_posts} />
          <Metric label={t.openPolls} value={data.summary.open_polls} />
          <Metric label={t.unread} value={data.summary.unread_notifications} />
        </div>
      ) : null}
      {loading ? (
        <Box value={t.loading} />
      ) : error ? (
        <Box value={error} />
      ) : !data?.rows.length ? (
        <Box value={t.empty} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border bg-white">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-[#F6F9FC] text-[#52667A]">
                <tr>
                  <th className="p-3 text-start">{t.date}</th>
                  <th className="p-3 text-start">{t.subject}</th>
                  <th className="p-3 text-start">{t.channel}</th>
                  <th className="p-3 text-start">{t.result}</th>
                  <th className="p-3 text-start">{t.state}</th>
                  <th className="p-3 text-start">{t.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rows.map((r) => (
                  <tr key={String(r.id)}>
                    <Cells row={r} view={view} lang={lang} />
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        className="font-bold text-[#087A6E]"
                      >
                        {t.details}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between text-xs text-[#52667A]">
            <span>
              {offset + 1}–{Math.min(offset + 20, data.total)} / {data.total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!offset}
                onClick={() => setOffset(Math.max(0, offset - 20))}
                className="rounded-xl border bg-white p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </button>
              <button
                type="button"
                disabled={offset + 20 >= data.total}
                onClick={() => setOffset(offset + 20)}
                className="rounded-xl border bg-white p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </>
      )}
      {selected ? (
        <Detail
          row={selected}
          close={() => setSelected(null)}
          label={t.close}
        />
      ) : null}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-bold text-[#52667A]">
        <Bell className="me-1 inline h-4 w-4 text-[#0E9F8E]" />
        {label}
      </div>
      <div className="mt-2 text-xl font-extrabold text-[#102A43]">
        {show(value)}
      </div>
    </div>
  );
}
function Box({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center text-sm text-[#52667A]">
      {value}
    </div>
  );
}
function Cells({
  row: r,
  view,
  lang,
}: {
  row: Record<string, unknown>;
  view: View;
  lang: string;
}) {
  const when = r.published_at ?? r.opens_at ?? r.created_at ?? r.responded_at;
  const subject =
    r.title ?? r.question ?? r.name ?? r.label ?? r.post_title ?? r.type;
  const channel = r.channel_name ?? r.scope ?? r.entity_type ?? r.property_name;
  const value =
    view === "results" || view === "polls"
      ? r.option_totals
      : (r.response_count ??
        r.comment_count ??
        r.reaction_count ??
        r.entity_label ??
        r.unread ??
        r.member);
  return (
    <>
      <td className="p-3">{date(when, lang)}</td>
      <td className="p-3 font-bold">{show(subject)}</td>
      <td className="p-3">{show(channel)}</td>
      <td className="p-3 font-mono">{show(value)}</td>
      <td className="p-3">{show(r.status ?? r.unread ?? r.relation_type)}</td>
    </>
  );
}
function Detail({
  row,
  close,
  label,
}: {
  row: Record<string, unknown>;
  close: () => void;
  label: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4"
    >
      <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6">
        <div className="flex justify-end">
          <button type="button" onClick={close} aria-label={label}>
            <X />
          </button>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {Object.entries(row)
            .filter(([k]) => !hidden.has(k))
            .map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[#F6F9FC] p-3">
                <dt className="text-xs font-bold text-[#52667A]">{k}</dt>
                <dd className="mt-1 break-words text-xs text-[#102A43]">
                  {show(v)}
                </dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
}
