import { redirect } from 'next/navigation';
import { isSupportedLocale } from '@/types';
import { CustomerAppShell } from '@/components/customer/CustomerAppShell';
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

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) redirect(`/${lang}/login?reason=security`);
  if (!factors.totp.some((factor) => factor.status === 'verified')) {
    redirect(`/${lang}/mfa/setup?reason=customer_required`);
  }

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) redirect(`/${lang}/login?reason=security`);
  if (assurance.currentLevel !== 'aal2') {
    redirect(`/${lang}/mfa`);
  }

  return <CustomerAppShell lang={lang}>{children}</CustomerAppShell>;
}
