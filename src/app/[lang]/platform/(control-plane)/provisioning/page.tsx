import { Terminal } from 'lucide-react';
import { OperationalProvisioningPanel } from '@/components/platform/OperationalProvisioningPanel';
export const dynamic = 'force-dynamic';
export default async function PlatformProvisioningPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const fa=lang==='fa',ro=lang==='ro';
  return <div className="mx-auto max-w-7xl space-y-6" dir={fa?'rtl':'ltr'}><div className="border-b border-[#1E3A5A] pb-6"><h1 className="flex items-center gap-2 text-xl font-black text-white md:text-2xl"><Terminal className="h-6 w-6 text-emerald-400"/>{fa?'راه‌اندازی فضای کاری و چرخه اجرا':ro?'Provisionarea spațiului și ciclul de execuție':'Workspace Provisioning & Run Lifecycle'}</h1><p className="mt-1 text-sm text-slate-300">{fa?'اجرای کنترل‌شده، تکرارپذیر و قابل ممیزی فقط برای فضای کاری واجد شرایط':ro?'Execuție controlată, idempotentă și auditabilă pentru spații eligibile':'Controlled, idempotent, and auditable execution for eligible workspaces'}</p></div><OperationalProvisioningPanel lang={lang}/></div>;
}
