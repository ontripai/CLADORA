'use client';

import { useState } from 'react';
import { Building2, Loader2, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CladoraBrand } from '@/components/brand/CladoraBrand';
import type { Language } from '@/types';

export type ClaimableWorkspaceInvitation = {
  invitation_id: string;
  workspace_label: string;
  workspace_type: string;
  workspace_environment: string;
  access_label: string;
  invitation_expires_at: string;
};

type Props = {
  lang: Language;
  invitations: ClaimableWorkspaceInvitation[];
};

const copy = {
  ro: {
    title: 'Finalizează invitația',
    intro: 'Confirmă profilul și spațiul de lucru pe care dorești să îl activezi.',
    name: 'Nume complet',
    choose: 'Alege spațiul de lucru',
    access: 'Acces',
    expires: 'Expiră',
    submit: 'Continuă în siguranță',
    working: 'Se verifică…',
    failed: 'Invitația nu mai poate fi finalizată. Reîncarcă pagina sau solicită o invitație nouă.',
  },
  en: {
    title: 'Complete your invitation',
    intro: 'Confirm your profile and the workspace that you want to activate.',
    name: 'Full name',
    choose: 'Choose a workspace',
    access: 'Access',
    expires: 'Expires',
    submit: 'Continue securely',
    working: 'Verifying…',
    failed: 'The invitation can no longer be completed. Reload the page or request a new invitation.',
  },
  fa: {
    title: 'تکمیل دعوت‌نامه',
    intro: 'مشخصات و فضای کاری موردنظر برای فعال‌سازی را تأیید کنید.',
    name: 'نام و نام خانوادگی',
    choose: 'انتخاب فضای کاری',
    access: 'سطح دسترسی',
    expires: 'زمان انقضا',
    submit: 'ادامه امن',
    working: 'در حال بررسی…',
    failed: 'تکمیل این دعوت‌نامه ممکن نیست. صفحه را دوباره بارگذاری کنید یا دعوت جدیدی درخواست کنید.',
  },
} as const;

export function WorkspaceInvitationContinuation({ lang, invitations }: Props) {
  const t = copy[lang];
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(invitations.length === 1 ? invitations[0].invitation_id : '');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/workspace-invitations/claim', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitation_id: selectedId,
          display_name: displayName,
          locale: lang,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Bucharest',
        }),
      });

      if (!response.ok) {
        setError(t.failed);
        return;
      }

      router.replace(`/${lang}/set-password`);
      router.refresh();
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-proptech space-y-6 border-[#D3DCE6] bg-white p-8 shadow-elevated">
      <div className="space-y-2 text-center">
        <CladoraBrand variant="symbol" decorative className="mx-auto h-12 w-12" />
        <h1 className="text-2xl font-extrabold text-[#102A43]">{t.title}</h1>
        <p className="text-xs leading-5 text-[#334E68]">{t.intro}</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <label htmlFor="invitationDisplayName" className="block text-xs font-bold text-[#102A43]">
          {t.name}
        </label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#486581]" />
          <input
            id="invitationDisplayName"
            name="display_name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-xl border border-[#D3DCE6] py-2.5 pe-3 ps-9 text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-xs font-bold text-[#102A43]">{t.choose}</legend>
          {invitations.map((invitation) => {
            const selected = invitation.invitation_id === selectedId;
            return (
              <label
                key={invitation.invitation_id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-start ${selected ? 'border-[#087A6E] bg-[#EAF8F5]' : 'border-[#D3DCE6] bg-white'}`}
              >
                <input
                  type="radio"
                  name="invitation_id"
                  value={invitation.invitation_id}
                  checked={selected}
                  onChange={() => setSelectedId(invitation.invitation_id)}
                  className="mt-1 accent-[#087A6E]"
                  required
                />
                <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#087A6E]" />
                <span className="min-w-0 text-xs text-[#334E68]">
                  <strong className="block truncate text-sm text-[#102A43]">{invitation.workspace_label}</strong>
                  <span className="mt-1 block">{invitation.workspace_type} · {invitation.workspace_environment}</span>
                  <span className="mt-1 block">{t.access}: {invitation.access_label}</span>
                  <span className="mt-1 block">{t.expires}: {new Date(invitation.invitation_expires_at).toLocaleString(lang)}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {error ? (
          <p role="alert" className="rounded-xl border border-[#F5B7B1] bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || !selectedId}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087A6E] px-4 py-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t.working : t.submit}
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        </button>
      </form>
    </div>
  );
}
