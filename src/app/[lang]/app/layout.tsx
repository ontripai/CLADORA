import { redirect } from 'next/navigation';
import type { Language } from '@/types';
import { AppShell } from '@/components/app/AppShell';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: Language };
}) {
  if (!isSupabaseConfigured()) {
    redirect(`/${params.lang}/login?reason=configuration`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect(`/${params.lang}/login`);
  }

  return <AppShell params={params}>{children}</AppShell>;
}
