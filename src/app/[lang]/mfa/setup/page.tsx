import { redirect } from 'next/navigation';
import { AccountSecurityPanel } from '@/components/auth/AccountSecurityPanel';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { isSupportedLocale } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MfaSetupPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) redirect('/ro/login');
  if (!isSupabaseConfigured()) redirect(`/${lang}/login?reason=configuration`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect(`/${lang}/login`);
  return <main className="mx-auto flex min-h-screen max-w-3xl items-center bg-[#F6F9FC] p-6"><AccountSecurityPanel lang={lang} /></main>;
}
