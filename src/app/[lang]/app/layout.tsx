import { redirect } from 'next/navigation';
import { isSupportedLocale } from '@/types';
import { AppShell } from '@/components/app/AppShell';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AppLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
  }
) {
  const params = await props.params;

  const { lang } = params;

  if (!isSupportedLocale(lang)) {
    redirect('/ro/login');
  }

  const {
    children
  } = props;

  if (!isSupabaseConfigured()) {
    redirect(`/${lang}/login?reason=configuration`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect(`/${lang}/login`);
  }

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) redirect(`/${lang}/login?reason=security`);
  if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
    redirect(`/${lang}/mfa`);
  }

  return <AppShell params={{ lang }}>{children}</AppShell>;
}
