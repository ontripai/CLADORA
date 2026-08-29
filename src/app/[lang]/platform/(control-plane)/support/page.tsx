import { LifeBuoy, ShieldAlert, Lock } from 'lucide-react';
import { OperationalSupportPanel } from '@/components/platform/OperationalSupportPanel';

export const dynamic = 'force-dynamic';

export default async function PlatformSupportPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isRo = lang === 'ro';
  const isFa = lang === 'fa';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E3A5A] pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-emerald-400" />
            <span>
              {isRo
                ? 'Acces Suport Tehnic (Control Dublu)'
                : isFa
                ? 'دسترسی پشتیبانی فنی (کنترل دوطرفه)'
                : 'Support Access & Dual-Control Security Console'}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            {isRo
              ? 'Infrastructură de acces temporar limitat în timp pentru suport tehnic cu aprobare independentă și justificare de tichet.'
              : isFa
              ? 'زیرساخت دسترسی موقت و زمان‌دار جهت پشتیبانی فنی با تأیید مستقل و شماره تیکت معتبر.'
              : 'Time-bound, ticket-referenced temporary support access foundation with mandatory independent approval.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>No Routine Customer Access</span>
          </span>
        </div>
      </div>

      {/* Safety Directive Card */}
      <div className="p-6 bg-[#0F2236] rounded-xl border border-[#1E3A5A] space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>{isRo ? 'Reguli de Securitate Suport Tehnic' : isFa ? 'قوانین امنیتی دسترسی پشتیبانی' : 'Support Access Security Rules'}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#081320] rounded-lg border border-[#1B324D] space-y-1">
            <span className="font-bold text-emerald-300 block">1. Justificare & Tichet</span>
            <p className="text-slate-300">
              Niciun acces nu poate fi inițiat fără un număr valid de tichet și o justificare explicită a scopului tehnic.
            </p>
          </div>
          <div className="p-4 bg-[#081320] rounded-lg border border-[#1B324D] space-y-1">
            <span className="font-bold text-emerald-300 block">2. Aprobare Independentă</span>
            <p className="text-slate-300">
              Solicitantul nu își poate aproba propria cerere de acces (control dublu strict).
            </p>
          </div>
          <div className="p-4 bg-[#081320] rounded-lg border border-[#1B324D] space-y-1">
            <span className="font-bold text-emerald-300 block">3. Expirare Automată</span>
            <p className="text-slate-300">
              Accesul expiră automat după intervalul aprobat și este revocat instantaneu la nivelul politicilor RLS.
            </p>
          </div>
        </div>
      </div>
      <OperationalSupportPanel lang={lang} />
    </div>
  );
}
