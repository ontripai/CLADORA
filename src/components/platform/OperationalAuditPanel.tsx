'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Search, ShieldCheck, X } from 'lucide-react';

type AuditEvent = {
  id: number;
  workspace_id: string | null;
  actor_id: string | null;
  actor_display_name: string;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  request_id: string | null;
  reason: string | null;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  occurred_at: string;
};

type AuditResponse = {
  events: AuditEvent[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
};

const copy = {
  ro: {
    search: 'Caută acțiune, entitate, actor sau motiv', action: 'Acțiune exactă', role: 'Rol actor',
    entity: 'Tip entitate', workspace: 'ID spațiu de lucru', from: 'De la', until: 'Până la',
    apply: 'Aplică filtre', clear: 'Șterge', empty: 'Nu există evenimente pentru filtrele și accesul curent.',
    error: 'Jurnalul de audit nu a putut fi încărcat.', loading: 'Se încarcă jurnalul protejat…',
    event: 'Eveniment', actor: 'Actor', target: 'Entitate', time: 'Moment', details: 'Detalii',
    reason: 'Motiv / justificare', before: 'Înainte', after: 'După', unchanged: 'Fără snapshot',
    workspaceLabel: 'Spațiu de lucru', request: 'Cerere', total: 'evenimente autorizate',
  },
  en: {
    search: 'Search action, entity, actor, or reason', action: 'Exact action', role: 'Actor role',
    entity: 'Entity type', workspace: 'Workspace ID', from: 'From', until: 'Until',
    apply: 'Apply filters', clear: 'Clear', empty: 'No events match the current filters and access scope.',
    error: 'The audit trail could not be loaded.', loading: 'Loading protected audit trail…',
    event: 'Event', actor: 'Actor', target: 'Entity', time: 'Time', details: 'Details',
    reason: 'Reason / justification', before: 'Before', after: 'After', unchanged: 'No snapshot',
    workspaceLabel: 'Workspace', request: 'Request', total: 'authorized events',
  },
  fa: {
    search: 'جست‌وجوی عملیات، موجودیت، عامل یا دلیل', action: 'عملیات دقیق', role: 'نقش عامل',
    entity: 'نوع موجودیت', workspace: 'شناسه محیط کاری', from: 'از تاریخ', until: 'تا تاریخ',
    apply: 'اعمال فیلترها', clear: 'پاک‌کردن', empty: 'رویدادی مطابق فیلترها و دامنه دسترسی یافت نشد.',
    error: 'بارگذاری دفتر ممیزی ممکن نشد.', loading: 'در حال بارگذاری دفتر ممیزی محافظت‌شده…',
    event: 'رویداد', actor: 'عامل', target: 'موجودیت', time: 'زمان', details: 'جزئیات',
    reason: 'دلیل / توجیه', before: 'قبل', after: 'بعد', unchanged: 'بدون Snapshot',
    workspaceLabel: 'محیط کاری', request: 'درخواست', total: 'رویداد مجاز',
  },
} as const;

const roles = ['', 'PLATFORM_SUPER_ADMIN', 'PLATFORM_OPERATIONS', 'PLATFORM_FINANCE', 'PLATFORM_SUPPORT', 'PLATFORM_AUDITOR'];

function JsonSnapshot({ value, empty }: { value: Record<string, unknown> | null; empty: string }) {
  if (!value || Object.keys(value).length === 0) return <div className="text-slate-500">{empty}</div>;
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[#1E3A5A] bg-[#081320] p-3 text-[11px] leading-5 text-slate-200">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function OperationalAuditPanel({ lang }: { lang: string }) {
  const locale = lang === 'ro' || lang === 'fa' ? lang : 'en';
  const l = copy[locale];
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [offset, setOffset] = useState(0);
  const [draft, setDraft] = useState({ q: '', action: '', actor_role: '', entity_type: '', workspace_id: '', from: '', until: '' });
  const [filters, setFilters] = useState(draft);

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '20', offset: String(offset) });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const response = await fetch(`/api/platform/v1/audit?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('audit');
      setData(await response.json());
    } catch {
      setError(l.error);
    } finally {
      setLoading(false);
    }
  }, [filters, offset, l.error]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const range = useMemo(() => {
    if (!data?.pagination.total) return '0';
    return `${data.pagination.offset + 1}–${Math.min(data.pagination.offset + data.events.length, data.pagination.total)} / ${data.pagination.total}`;
  }, [data]);

  const apply = () => { setOffset(0); setFilters(draft); };
  const clear = () => {
    const empty = { q: '', action: '', actor_role: '', entity_type: '', workspace_id: '', from: '', until: '' };
    setDraft(empty); setFilters(empty); setOffset(0);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1E3A5A] bg-[#0F2236] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative xl:col-span-2">
            <Search className="absolute start-3 top-3 h-4 w-4 text-slate-500" />
            <input aria-label={l.search} value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              placeholder={l.search} className="w-full rounded-lg border border-[#29445F] bg-[#081320] py-2.5 ps-9 pe-3 text-xs text-white outline-none focus:border-emerald-400" />
          </label>
          <input aria-label={l.action} value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
            placeholder={l.action} className="rounded-lg border border-[#29445F] bg-[#081320] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400" />
          <select aria-label={l.role} value={draft.actor_role} onChange={(e) => setDraft({ ...draft, actor_role: e.target.value })}
            className="rounded-lg border border-[#29445F] bg-[#081320] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400">
            <option value="">{l.role}</option>{roles.slice(1).map((role) => <option key={role}>{role}</option>)}
          </select>
          <input aria-label={l.entity} value={draft.entity_type} onChange={(e) => setDraft({ ...draft, entity_type: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            placeholder={l.entity} className="rounded-lg border border-[#29445F] bg-[#081320] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400" />
          <input aria-label={l.workspace} value={draft.workspace_id} onChange={(e) => setDraft({ ...draft, workspace_id: e.target.value.trim() })}
            placeholder={l.workspace} className="rounded-lg border border-[#29445F] bg-[#081320] px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-emerald-400" />
          <input type="datetime-local" aria-label={l.from} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            className="rounded-lg border border-[#29445F] bg-[#081320] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400" />
          <input type="datetime-local" aria-label={l.until} value={draft.until} onChange={(e) => setDraft({ ...draft, until: e.target.value })}
            className="rounded-lg border border-[#29445F] bg-[#081320] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={apply} className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-[#081320] hover:bg-emerald-400">{l.apply}</button>
          <button type="button" onClick={clear} className="rounded-lg border border-[#29445F] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-[#142A40]">{l.clear}</button>
          <span className="ms-auto text-xs text-slate-400">{range} {l.total}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1E3A5A] bg-[#0F2236]">
        {loading ? <div className="p-10 text-center text-sm text-slate-400">{l.loading}</div>
          : error ? <div className="p-10 text-center text-sm text-rose-300">{error}</div>
          : !data?.events.length ? <div className="p-10 text-center text-sm text-slate-400">{l.empty}</div>
          : <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-start text-xs">
              <thead className="border-b border-[#1E3A5A] bg-[#081320] text-[10px] uppercase tracking-wider text-slate-400">
                <tr><th className="px-4 py-3">{l.event}</th><th className="px-4 py-3">{l.actor}</th><th className="px-4 py-3">{l.target}</th><th className="px-4 py-3">{l.time}</th><th className="px-4 py-3">{l.details}</th></tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A5A] text-slate-300">
                {data.events.map((event) => (
                  <tr key={event.id} className="hover:bg-[#12283E]">
                    <td className="px-4 py-3"><div className="font-mono font-bold text-teal-300">{event.action}</div><div className="mt-1 text-[10px] text-slate-500">#{event.id}</div></td>
                    <td className="px-4 py-3"><div className="font-semibold text-white">{event.actor_display_name}</div><div className="font-mono text-[10px] text-slate-400">{event.actor_role ?? 'SYSTEM'}</div></td>
                    <td className="px-4 py-3"><div>{event.entity_type}</div><div className="max-w-52 truncate font-mono text-[10px] text-slate-500">{event.entity_id ?? '—'}</div></td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.occurred_at))}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelected(event)} aria-label={l.details} className="rounded-lg border border-[#29445F] p-2 text-emerald-300 hover:bg-[#18344D]"><Eye className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        <div className="flex items-center justify-end gap-2 border-t border-[#1E3A5A] p-3">
          <button type="button" aria-label="Previous page" disabled={!data || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))} className="rounded-lg border border-[#29445F] p-2 text-slate-300 disabled:opacity-30"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
          <button type="button" aria-label="Next page" disabled={!data?.pagination.hasMore} onClick={() => setOffset(offset + 20)} className="rounded-lg border border-[#29445F] p-2 text-slate-300 disabled:opacity-30"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
        </div>
      </div>

      {selected ? <div role="dialog" aria-modal="true" aria-label={l.details} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onMouseDown={(e) => { if (e.currentTarget === e.target) setSelected(null); }}>
        <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[#29445F] bg-[#0F2236] p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-[#1E3A5A] pb-4">
            <div><div className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-300"><ShieldCheck className="h-5 w-5" />{selected.action}</div><div className="mt-1 text-xs text-slate-400">#{selected.id} · {selected.entity_type} · {selected.entity_id ?? '—'}</div></div>
            <button type="button" onClick={() => setSelected(null)} aria-label={l.clear} className="rounded-lg p-2 text-slate-400 hover:bg-[#18344D]"><X className="h-5 w-5" /></button>
          </div>
          <dl className="my-4 grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
            <div><dt className="text-slate-500">{l.actor}</dt><dd className="mt-1 text-white">{selected.actor_display_name} · {selected.actor_role ?? 'SYSTEM'}<br /><span className="font-mono text-slate-400">{selected.actor_id ?? '—'}</span></dd></div>
            <div><dt className="text-slate-500">{l.time}</dt><dd className="mt-1 text-white">{new Date(selected.occurred_at).toLocaleString(locale)}</dd></div>
            <div><dt className="text-slate-500">{l.workspaceLabel}</dt><dd className="mt-1 font-mono text-white">{selected.workspace_id ?? 'GLOBAL'}</dd></div>
            <div><dt className="text-slate-500">{l.request}</dt><dd className="mt-1 font-mono text-white">{selected.request_id ?? '—'}</dd></div>
            <div className="md:col-span-2"><dt className="text-slate-500">{l.reason}</dt><dd className="mt-1 text-white">{selected.reason ?? '—'}</dd></div>
          </dl>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-rose-300">{l.before}</h3><JsonSnapshot value={selected.before_snapshot} empty={l.unchanged} /></section>
            <section><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-300">{l.after}</h3><JsonSnapshot value={selected.after_snapshot} empty={l.unchanged} /></section>
          </div>
        </div>
      </div> : null}
    </div>
  );
}
