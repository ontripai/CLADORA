import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';
import type { Language } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Set CLADORA account password',
  robots: { index: false, follow: false, nocache: true },
};

export default async function SetPasswordPage(props: { params: Promise<{ lang: Language }> }) {
  const { lang } = await props.params;
  if (!isSupabaseConfigured()) redirect(`/${lang}/invitation-result?status=invalid`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect(`/${lang}/invitation-result?status=invalid`);

  return (
    <main dir={lang === 'fa' ? 'rtl' : 'ltr'} className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-4 pb-24 pt-32">
      <div className="w-full max-w-md">
        <ResetPasswordForm lang={lang} flow="invitation" />
      </div>
    </main>
  );
}
