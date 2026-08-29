import { FileText, Lock } from 'lucide-react';
import { OperationalAuditPanel } from '@/components/platform/OperationalAuditPanel';

export const dynamic = 'force-dynamic';

export default async function PlatformAuditPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#1E3A5A] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-white md:text-2xl">
            <FileText className="h-6 w-6 text-emerald-400" />
            <span>{isRo ? 'Jurnal de Audit & Integritate Control Plane' : isFa ? 'دفتر کل ممیزی و رویدادهای امنیتی' : 'Control Plane Security & Audit Trail'}</span>
          </h1>
          <p className="mt-1 text-xs text-slate-300 md:text-sm">
            {isRo
              ? 'Explorator read-only, protejat AAL2, cu vizibilitate limitată prin alocarea clientului și snapshot-uri redactate.'
              : isFa
                ? 'کاوشگر فقط‌خواندنی محافظت‌شده با AAL2، محدود به تخصیص مشتری و دارای Snapshotهای پاک‌سازی‌شده.'
                : 'Read-only AAL2-protected explorer with assignment-scoped visibility and recursively redacted snapshots.'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-300">
          <Lock className="h-3.5 w-3.5" />
          <span>{isRo ? 'Append-only · Redactat' : isFa ? 'فقط‌افزودنی · پاک‌سازی‌شده' : 'Append-only · Redacted'}</span>
        </span>
      </div>
      <OperationalAuditPanel lang={lang} />
    </div>
  );
}
