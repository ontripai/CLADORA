import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AcceptInvitationForm } from '@/components/auth/AcceptInvitationForm';
import { createClient } from '@/lib/supabase/server';
import type { Language } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Activate CLADORA account',
  robots: { index: false, follow: false },
};

export default async function AcceptInvitationPage(props: {
  params: Promise<{ lang: Language }>;
}) {
  const { lang } = await props.params;
  const token = (await cookies()).get('cladora-invitation')?.value;
  if (!token || token.length < 40 || token.length > 128) {
    redirect(`/${lang}/login?reason=invalid_invitation`);
  }

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub) {
    redirect(`/${lang}/login?reason=invitation_session_required`);
  }

  const { data: invitation, error } = await supabase
    .schema('platform')
    .rpc('validate_workspace_invitation', { p_token: token });
  if (error || !Array.isArray(invitation) || invitation.length !== 1) {
    redirect(`/${lang}/login?reason=invalid_invitation`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-4 pb-24 pt-32">
      <div className="w-full max-w-md">
        <AcceptInvitationForm lang={lang} />
      </div>
    </main>
  );
}
