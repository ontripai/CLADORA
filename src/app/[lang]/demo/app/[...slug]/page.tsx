import { notFound } from 'next/navigation';
import type { Language } from '@/types';
import DashboardPage from '@/components/demo/DemoDashboardPage';
import AccountingPage from '@/app/[lang]/app/accounting/page';
import MonthClosePage from '@/app/[lang]/app/accounting/month-close/page';
import AllocationsPage from '@/app/[lang]/app/accounting/allocations/page';
import MetersPage from '@/app/[lang]/app/meters/page';
import MaintenancePage from '@/app/[lang]/app/maintenance/page';
import GovernancePage from '@/app/[lang]/app/governance/page';
import CommunicationsPage from '@/app/[lang]/app/communications/page';
import DocumentsPage from '@/app/[lang]/app/documents/page';
import PortfolioPage from '@/app/[lang]/app/portfolio/page';
import MigrationPage from '@/app/[lang]/app/migration/shadow-ledger/page';
import AuditPage from '@/app/[lang]/app/audit/page';

export default async function DemoAppPage({ params }: { params: Promise<{ lang: Language; slug: string[] }> }) {
  const { lang, slug } = await params;
  const route = slug.join('/');
  const pageParams = Promise.resolve({ lang });
  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage params={pageParams} demoMode />,
    accounting: <AccountingPage params={pageParams} demoMode />,
    'accounting/month-close': <MonthClosePage params={pageParams} />,
    'accounting/allocations': <AllocationsPage params={pageParams} />,
    meters: <MetersPage params={pageParams} />,
    maintenance: <MaintenancePage params={pageParams} />,
    governance: <GovernancePage params={pageParams} />,
    communications: <CommunicationsPage params={pageParams} />,
    documents: <DocumentsPage params={pageParams} />,
    portfolio: <PortfolioPage params={pageParams} />,
    'migration/shadow-ledger': <MigrationPage params={pageParams} />,
    audit: <AuditPage params={pageParams} />,
    settings: <div className="card-proptech bg-white p-8 text-sm text-[#334E68]">{lang === 'fa' ? 'تنظیمات امنیتی حساب فقط در اپلیکیشن واقعی در دسترس است؛ محیط دمو به حساب کاربری متصل نیست.' : lang === 'ro' ? 'Setările de securitate sunt disponibile doar în aplicația reală; demo-ul nu este conectat la un cont.' : 'Account security settings are available only in the real application; the demo is not connected to an account.'}</div>,
  };
  return pages[route] ?? notFound();
}
