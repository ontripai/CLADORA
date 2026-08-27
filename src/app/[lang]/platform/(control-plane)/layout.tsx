import React from 'react';
import { redirect } from 'next/navigation';
import { isSupportedLocale } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getPlatformAuthContext } from '@/lib/platform/auth';
import { PlatformShell } from '@/components/platform/PlatformShell';

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

  return (
    <PlatformShell lang={lang} authCtx={authCtx}>
      {props.children}
    </PlatformShell>
  );
}
