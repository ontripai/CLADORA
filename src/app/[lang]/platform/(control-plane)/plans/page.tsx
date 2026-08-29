import { Layers } from 'lucide-react';
import { OperationalPlansPanel } from '@/components/platform/OperationalPlansPanel';
export const dynamic = 'force-dynamic';
export default async function PlatformPlansPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params; const fa=lang==='fa',ro=lang==='ro';
  return <div className="mx-auto max-w-7xl space-y-6" dir={fa?'rtl':'ltr'}><div className="border-b border-[#1E3A5A] pb-6"><h1 className="flex items-center gap-2 text-xl font-black text-white md:text-2xl"><Layers className="h-6 w-6 text-emerald-400"/>{fa?'طرح‌های اشتراک و کاتالوگ قابلیت‌ها':ro?'Planuri de abonament și catalogul funcțiilor':'Subscription Plans & Feature Catalogue'}</h1><p className="mt-1 text-sm text-slate-300">{fa?'نسخه‌ها، محدودیت‌ها و وابستگی‌های واقعی قرارداد و فضای کاری':ro?'Versiuni, limite și dependențe reale de contract și spațiu de lucru':'Versioned plans, enforced limits, and live contract/workspace dependencies'}</p></div><OperationalPlansPanel lang={lang}/></div>;
}
