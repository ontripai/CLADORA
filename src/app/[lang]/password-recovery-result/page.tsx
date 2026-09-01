import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CladoraBrand } from '@/components/brand/CladoraBrand';
import type { Language } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RecoveryStatus = 'requested' | 'updated' | 'invalid';

const copy = {
  ro: {
    requested: {
      title: 'Verifică emailul',
      message: 'Dacă există un cont eligibil pentru adresa introdusă, instrucțiunile de recuperare vor fi trimise. Mesajul poate ajunge în câteva minute.',
      action: 'Înapoi la autentificare',
    },
    updated: {
      title: 'Parola a fost actualizată',
      message: 'Parola a fost schimbată. Toate sesiunile existente au fost închise; autentifică-te din nou.',
      action: 'Autentifică-te',
    },
    invalid: {
      title: 'Link nevalid sau expirat',
      message: 'Linkul de recuperare nu mai poate fi utilizat. Solicită un link nou pentru a continua în siguranță.',
      action: 'Solicită un link nou',
    },
  },
  en: {
    requested: {
      title: 'Check your email',
      message: 'If an eligible account exists for the submitted address, recovery instructions will be sent. Delivery may take a few minutes.',
      action: 'Back to sign in',
    },
    updated: {
      title: 'Password updated',
      message: 'Your password has been changed. Existing sessions were closed; sign in again to continue.',
      action: 'Sign in',
    },
    invalid: {
      title: 'Invalid or expired link',
      message: 'This recovery link can no longer be used. Request a new link to continue securely.',
      action: 'Request a new link',
    },
  },
  fa: {
    requested: {
      title: 'ایمیل خود را بررسی کنید',
      message: 'اگر برای آدرس واردشده حساب واجد شرایطی وجود داشته باشد، راهنمای بازیابی ارسال می‌شود. دریافت پیام ممکن است چند دقیقه زمان ببرد.',
      action: 'بازگشت به صفحه ورود',
    },
    updated: {
      title: 'رمز عبور به‌روزرسانی شد',
      message: 'رمز عبور تغییر کرد و نشست‌های موجود بسته شدند؛ برای ادامه دوباره وارد شوید.',
      action: 'ورود به حساب',
    },
    invalid: {
      title: 'پیوند نامعتبر یا منقضی',
      message: 'این پیوند بازیابی دیگر قابل استفاده نیست. برای ادامه امن، پیوند جدیدی درخواست کنید.',
      action: 'درخواست پیوند جدید',
    },
  },
} as const;

export const metadata: Metadata = {
  title: 'CLADORA account recovery',
  robots: { index: false, follow: false, nocache: true },
};

export default async function PasswordRecoveryResultPage(props: {
  params: Promise<{ lang: Language }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { lang } = await props.params;
  const query = await props.searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status: RecoveryStatus =
    rawStatus === 'requested' || rawStatus === 'updated' ? rawStatus : 'invalid';
  const t = copy[lang][status];
  const successful = status !== 'invalid';
  const Icon = successful ? CheckCircle2 : AlertTriangle;
  const href = status === 'invalid' ? `/${lang}/forgot-password` : `/${lang}/login`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-4 pb-24 pt-32">
      <div className="card-proptech w-full max-w-md space-y-6 border-[#D3DCE6] bg-white p-8 text-center shadow-elevated">
        <CladoraBrand variant="symbol" decorative className="mx-auto h-12 w-12" />
        <Icon
          aria-hidden="true"
          className={`mx-auto h-10 w-10 ${successful ? 'text-[#087A6E]' : 'text-[#B42318]'}`}
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#102A43]">{t.title}</h1>
          <p className="text-xs leading-6 text-[#334E68]">{t.message}</p>
        </div>
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[#087A6E] px-4 py-3 text-xs font-extrabold text-white hover:bg-[#065F55]"
        >
          {t.action}
        </Link>
      </div>
    </main>
  );
}
