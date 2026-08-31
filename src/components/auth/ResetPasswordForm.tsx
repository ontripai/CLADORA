'use client';

import { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CladoraBrand } from '@/components/brand/CladoraBrand';
import { createClient } from '@/lib/supabase/client';
import type { Language } from '@/types';

type Props = { lang: Language };

const copy = {
  ro: {
    title: 'Alege o parolă nouă',
    intro: 'Setează o parolă unică de cel puțin 12 caractere.',
    password: 'Parolă nouă',
    confirm: 'Confirmă parola',
    submit: 'Actualizează parola',
    working: 'Se actualizează…',
    mismatch: 'Parolele nu coincid.',
    weak: 'Parola trebuie să aibă cel puțin 12 caractere.',
    failed: 'Parola nu a putut fi actualizată. Linkul poate fi expirat sau nevalid.',
  },
  en: {
    title: 'Choose a new password',
    intro: 'Set a unique password containing at least 12 characters.',
    password: 'New password',
    confirm: 'Confirm password',
    submit: 'Update password',
    working: 'Updating…',
    mismatch: 'Passwords do not match.',
    weak: 'The password must contain at least 12 characters.',
    failed: 'The password could not be updated. The recovery link may be expired or invalid.',
  },
  fa: {
    title: 'انتخاب رمز عبور جدید',
    intro: 'یک رمز عبور منحصربه‌فرد با حداقل ۱۲ نویسه تعیین کنید.',
    password: 'رمز عبور جدید',
    confirm: 'تکرار رمز عبور',
    submit: 'به‌روزرسانی رمز عبور',
    working: 'در حال به‌روزرسانی…',
    mismatch: 'رمزهای عبور یکسان نیستند.',
    weak: 'رمز عبور باید حداقل ۱۲ نویسه داشته باشد.',
    failed: 'رمز عبور به‌روزرسانی نشد. ممکن است پیوند بازیابی منقضی یا نامعتبر باشد.',
  },
} as const;

export function ResetPasswordForm({ lang }: Props) {
  const t = copy[lang];
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError(t.weak);
      return;
    }
    if (password !== confirmation) {
      setError(t.mismatch);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(t.failed);
        return;
      }

      await supabase.auth.signOut({ scope: 'global' });
      router.replace(`/${lang}/password-recovery-result?status=updated`);
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

      <form onSubmit={submit} className="space-y-4">
        <label htmlFor="newPassword" className="block text-xs font-bold text-[#102A43]">
          {t.password}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#486581]" />
          <input
            id="newPassword"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-[#D3DCE6] py-2.5 pe-3 ps-9 text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
          />
        </div>

        <label htmlFor="confirmPassword" className="block text-xs font-bold text-[#102A43]">
          {t.confirm}
        </label>
        <input
          id="confirmPassword"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="w-full rounded-xl border border-[#D3DCE6] px-3 py-2.5 text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
        />

        {error && (
          <p role="alert" className="rounded-xl border border-[#F5B7B1] bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087A6E] px-4 py-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t.working : t.submit}
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        </button>
      </form>
    </div>
  );
}
