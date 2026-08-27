import React from 'react';
import { redirect } from 'next/navigation';
import { isSupportedLocale } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getPlatformAuthContext } from '@/lib/platform/auth';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PlatformControlPlaneLayout(
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

  if (!isSupabaseConfigured()) {
    redirect(`/${lang}/login?reason=configuration`);
  }

  const authCtx = await getPlatformAuthContext();

  if (!authCtx.isAuthorized || !authCtx.platformUser) {
    redirect(`/${lang}/login?reason=unauthorized_platform`);
  }

  const supabase = await createClient();
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) redirect(`/${lang}/login?reason=security`);
  if (!(factors?.totp ?? []).some((factor) => factor.status === 'verified')) {
    redirect(`/${lang}/mfa/setup?reason=platform_required`);
  }
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) redirect(`/${lang}/login?reason=security`);
  if (assurance.currentLevel !== 'aal2') {
    redirect(`/${lang}/mfa`);
  }

  return (
    <PlatformShell lang={lang} authCtx={authCtx}>
      {props.children}
    </PlatformShell>
  );
}
