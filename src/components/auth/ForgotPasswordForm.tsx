'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CladoraBrand } from '@/components/brand/CladoraBrand';
import { TurnstileWidget } from '@/components/auth/TurnstileWidget';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import type { Language } from '@/types';

type Props = {
  lang: Language;
  captchaRequired: boolean;
  captchaSiteKey?: string;
};

const copy = {
  ro: {
    title: 'Recuperează parola',
    intro: 'Introdu adresa de email. Dacă există un cont eligibil, vei primi instrucțiuni securizate.',
    email: 'Email',
    submit: 'Trimite instrucțiunile',
    working: 'Se trimite…',
    back: 'Înapoi la autentificare',
    unavailable: 'Serviciul securizat de autentificare nu este configurat.',
    captchaMissing: 'Verificarea anti-abuz este obligatorie, dar nu este configurată. Contactează administratorul.',
    captchaRequired: 'Finalizează verificarea anti-abuz înainte de a continua.',
    failed: 'Solicitarea nu a putut fi finalizată. Încearcă din nou mai târziu.',
  },
  en: {
    title: 'Recover your password',
    intro: 'Enter your email address. If an eligible account exists, secure instructions will be sent.',
    email: 'Email',
    submit: 'Send recovery instructions',
    working: 'Sending…',
    back: 'Back to sign in',
    unavailable: 'The secure authentication service is not configured.',
    captchaMissing: 'Abuse protection is required but not configured. Contact the administrator.',
    captchaRequired: 'Complete the abuse-protection check before continuing.',
    failed: 'The request could not be completed. Please try again later.',
  },
  fa: {
    title: 'بازیابی رمز عبور',
    intro: 'آدرس ایمیل را وارد کنید. اگر حساب واجد شرایطی وجود داشته باشد، راهنمای امن ارسال می‌شود.',
    email: 'پست الکترونیک',
    submit: 'ارسال راهنمای بازیابی',
    working: 'در حال ارسال…',
    back: 'بازگشت به صفحه ورود',
    unavailable: 'سرویس امن احراز هویت پیکربندی نشده است.',
    captchaMissing: 'بررسی ضدسوءاستفاده الزامی است اما پیکربندی نشده؛ با مدیر سامانه تماس بگیرید.',
    captchaRequired: 'پیش از ادامه، بررسی ضدسوءاستفاده را کامل کنید.',
    failed: 'درخواست قابل انجام نبود. لطفاً بعداً دوباره تلاش کنید.',
  },
} as const;

export function ForgotPasswordForm({ lang, captchaRequired, captchaSiteKey }: Props) {
  const t = copy[lang];
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const captchaConfigured = Boolean(captchaSiteKey);
  const captchaNeeded = captchaRequired || captchaConfigured;
  const captchaBlocked = captchaRequired && !captchaConfigured;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isSupabaseConfigured()) {
      setError(t.unavailable);
      return;
    }
    if (captchaBlocked) {
      setError(t.captchaMissing);
      return;
    }
    if (captchaNeeded && !captchaToken) {
      setError(t.captchaRequired);
      return;
    }

    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/${lang}/auth/callback?next=/${lang}/reset-password`;
      const { error: recoveryError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
        captchaToken: captchaToken ?? undefined,
      });

      if (recoveryError) {
        setCaptchaToken(null);
        setCaptchaAttempt((value) => value + 1);
        setError(t.failed);
        return;
      }

      router.replace(`/${lang}/password-recovery-result?status=requested`);
      router.refresh();
    } catch {
      setCaptchaToken(null);
      setCaptchaAttempt((value) => value + 1);
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
        <label htmlFor="recoveryEmail" className="block text-xs font-bold text-[#102A43]">
          {t.email}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#486581]" />
          <input
            id="recoveryEmail"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-[#D3DCE6] py-2.5 pe-3 ps-9 text-xs text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#087A6E]"
          />
        </div>

        {captchaSiteKey && (
          <TurnstileWidget
            key={captchaAttempt}
            siteKey={captchaSiteKey}
            lang={lang}
            onToken={setCaptchaToken}
          />
        )}

        {captchaBlocked && (
          <p role="alert" className="rounded-xl border border-[#F5B7B1] bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">
            {t.captchaMissing}
          </p>
        )}
        {error && !captchaBlocked && (
          <p role="alert" className="rounded-xl border border-[#F5B7B1] bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || captchaBlocked || (captchaNeeded && !captchaToken)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#087A6E] px-4 py-3 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t.working : t.submit}
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        </button>
      </form>

      <button
        type="button"
        onClick={() => router.replace(`/${lang}/login`)}
        className="mx-auto flex items-center gap-2 text-xs font-semibold text-[#087A6E] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t.back}
      </button>
    </div>
  );
}
