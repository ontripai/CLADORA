import { redirect } from 'next/navigation';
import { MfaChallengeForm } from '@/components/auth/MfaChallengeForm';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { isSupportedLocale } from '@/types';

export const dynamic = 'force-dynamic';

export default async function MfaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) redirect('/ro/login');
  if (!isSupabaseConfigured()) redirect(`/${lang}/login?reason=configuration`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect(`/${lang}/login`);
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === 'aal2' || assurance?.nextLevel !== 'aal2') redirect(`/${lang}/app/dashboard`);
  return <main className="flex min-h-screen items-center justify-center bg-[#F6F9FC] p-6"><MfaChallengeForm lang={lang} /></main>;
}
