import { AppShell } from '@/components/app/AppShell';
import { isSupportedLocale } from '@/types';
import { notFound } from 'next/navigation';

export default async function DemoAppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();
  return <AppShell params={{ lang }} demoMode>{children}</AppShell>;
}
