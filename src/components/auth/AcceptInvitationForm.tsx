'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, UserRound } from 'lucide-react';
import type { Language } from '@/types';

type Props = { lang: Language };

const copy = {
  ro: {
    title: 'Activează contul de administrator',
    intro: 'Alege parola și confirmă profilul pentru spațiul de lucru CLADORA.',
    name: 'Nume complet', password: 'Parolă nouă', confirm: 'Confirmă parola',
    submit: 'Activează contul', working: 'Se activează…',
    mismatch: 'Parolele nu coincid.', weak: 'Parola trebuie să aibă cel puțin 12 caractere.',
    failed: 'Invitația nu a putut fi acceptată. Verifică dacă linkul este încă valabil.',
  },
  en: {
    title: 'Activate administrator account',
    intro: 'Choose a password and confirm your profile for the CLADORA workspace.',
    name: 'Full name', password: 'New password', confirm: 'Confirm password',
    submit: 'Activate account', working: 'Activating…',
    mismatch: 'Passwords do not match.', weak: 'Password must contain at least 12 characters.',
    failed: 'The invitation could not be accepted. Check that the link is still valid.',
  },
  fa: {
    title: 'فعال‌سازی حساب مدیر',
    intro: 'رمز عبور و مشخصات خود را برای فضای کاری کلادورا تأیید کنید.',
    name: 'نام و نام خانوادگی', password: 'رمز عبور جدید', confirm: 'تکرار رمز عبور',
    submit: 'فعال‌سازی حساب', working: 'در حال فعال‌سازی…',
    mismatch: 'رمزهای عبور یکسان نیستند.', weak: 'رمز عبور باید حداقل ۱۲ نویسه داشته باشد.',
    failed: 'پذیرش دعوت انجام نشد. اعتبار لینک دعوت را بررسی کنید.',
  },
} as const;

export function AcceptInvitationForm({ lang }: Props) {
  const t = copy[lang];
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 12) return setError(t.weak);
    if (password !== confirmation) return setError(t.mismatch);

    setBusy(true);
    const response = await fetch('/api/auth/accept-invitation', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: displayName,
        password,
        locale: lang,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Bucharest',
      }),
    });

    if (!response.ok) {
      setBusy(false);
      return setError(t.failed);
    }

    router.replace(`/${lang}/app/dashboard?onboarding=required`);
    router.refresh();
  }

  return (
    <div className="card-proptech space-y-6 border-[#D3DCE6] bg-white p-8 shadow-elevated">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#102A43] to-[#087A6E] text-2xl font-extrabold text-white">C</div>
        <h1 className="text-2xl font-extrabold text-[#102A43]">{t.title}</h1>
        <p className="text-xs text-[#334E68]">{t.intro}</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs font-bold text-[#102A43]">
          {t.name}
          <span className="relative mt-1 block">
            <UserRound className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#486581]" />
            <input required minLength={2} maxLength={120} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-[#D3DCE6] py-2.5 pe-3 ps-9 text-xs focus:ring-2 focus:ring-[#087A6E]" />
          </span>
        </label>
        <label className="block text-xs font-bold text-[#102A43]">
          {t.password}
          <span className="relative mt-1 block">
            <Lock className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#486581]" />
            <input required minLength={12} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[#D3DCE6] py-2.5 pe-3 ps-9 text-xs focus:ring-2 focus:ring-[#087A6E]" />
          </span>
        </label>
        <label className="block text-xs font-bold text-[#102A43]">
          {t.confirm}
          <input required minLength={12} type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-1 w-full rounded-xl border border-[#D3DCE6] px-3 py-2.5 text-xs focus:ring-2 focus:ring-[#087A6E]" />
        </label>
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087A6E] px-4 py-3 text-xs font-extrabold text-white disabled:opacity-60">
          {busy ? t.working : t.submit}
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        </button>
        {error && <p role="alert" className="rounded-xl border border-[#F5B7B1] bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">{error}</p>}
      </form>
    </div>
  );
}
