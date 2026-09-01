import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CladoraBrand } from '@/components/brand/CladoraBrand';
import type { Language } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'CLADORA invitation result',
  robots: { index: false, follow: false, nocache: true },
};

const copy = {
  ro: {
    completed: { title: 'Contul a fost activat', message: 'Parola a fost setată și sesiunile anterioare au fost închise. Autentifică-te pentru a continua.', action: 'Autentifică-te' },
    invalid: { title: 'Activarea nu a fost finalizată', message: 'Fluxul de invitație nu mai este disponibil. Solicită o invitație nouă sau contactează administratorul.', action: 'Înapoi la autentificare' },
  },
  en: {
    completed: { title: 'Account activated', message: 'Your password was set and earlier sessions were closed. Sign in to continue.', action: 'Sign in' },
    invalid: { title: 'Activation not completed', message: 'The invitation flow is no longer available. Request a new invitation or contact the administrator.', action: 'Back to sign in' },
  },
  fa: {
    completed: { title: 'حساب فعال شد', message: 'رمز عبور تعیین و نشست‌های قبلی بسته شدند. برای ادامه وارد حساب شوید.', action: 'ورود به حساب' },
    invalid: { title: 'فعال‌سازی تکمیل نشد', message: 'جریان دعوت‌نامه دیگر در دسترس نیست. دعوت جدید بخواهید یا با مدیر تماس بگیرید.', action: 'بازگشت به ورود' },
  },
} as const;

export default async function InvitationResultPage(props: {
  params: Promise<{ lang: Language }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { lang } = await props.params;
  const query = await props.searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = rawStatus === 'completed' ? 'completed' : 'invalid';
  const t = copy[lang][status];
  const Icon = status === 'completed' ? CheckCircle2 : AlertTriangle;

  return (
    <main dir={lang === 'fa' ? 'rtl' : 'ltr'} className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-4 pb-24 pt-32">
      <div className="card-proptech w-full max-w-md space-y-6 border-[#D3DCE6] bg-white p-8 text-center shadow-elevated">
        <CladoraBrand variant="symbol" decorative className="mx-auto h-12 w-12" />
        <Icon aria-hidden="true" className={`mx-auto h-10 w-10 ${status === 'completed' ? 'text-[#087A6E]' : 'text-[#B42318]'}`} />
        <h1 className="text-2xl font-extrabold text-[#102A43]">{t.title}</h1>
        <p className="text-xs leading-6 text-[#334E68]">{t.message}</p>
        <Link href={`/${lang}/login`} className="inline-flex w-full items-center justify-center rounded-xl bg-[#087A6E] px-4 py-3 text-xs font-extrabold text-white">
          {t.action}
        </Link>
      </div>
    </main>
  );
}
