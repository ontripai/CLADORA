import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CladoraBrand } from '@/components/brand/CladoraBrand';
import { isSupportedLocale } from '@/lib/auth/email-callback.mjs';
import type { Language } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AuthResultStatus =
  | 'confirmed'
  | 'invalid'
  | 'expired'
  | 'reused'
  | 'missing'
  | 'unsafe'
  | 'invalid_type'
  | 'invalid_locale';

const copy = {
  ro: {
    confirmed: { title: 'Confirmare finalizată', message: 'Acțiunea de securitate a fost confirmată. Poți continua în siguranță.', action: 'Continuă la autentificare' },
    invalid: { title: 'Link nevalid', message: 'Linkul nu a putut fi verificat. Solicită un mesaj nou și încearcă din nou.', action: 'Înapoi la autentificare' },
    expired: { title: 'Link expirat', message: 'Linkul a expirat sau nu mai poate fi utilizat. Solicită un mesaj nou.', action: 'Înapoi la autentificare' },
    reused: { title: 'Link deja utilizat', message: 'Acest link cu utilizare unică nu mai este disponibil. Solicită un mesaj nou.', action: 'Înapoi la autentificare' },
    missing: { title: 'Token lipsă', message: 'Linkul este incomplet și nu a creat nicio sesiune. Solicită un mesaj nou.', action: 'Înapoi la autentificare' },
    unsafe: { title: 'Link blocat în siguranță', message: 'Linkul conținea date de autentificare într-un format neacceptat. Nu a fost creată nicio sesiune.', action: 'Înapoi la autentificare' },
    invalid_type: { title: 'Tip de confirmare nevalid', message: 'Tipul acestei solicitări nu este acceptat. Solicită un mesaj nou.', action: 'Înapoi la autentificare' },
    invalid_locale: { title: 'Limbă nevalidă', message: 'Limba linkului nu este acceptată. Continuă folosind o rută CLADORA validă.', action: 'Continuă în română' },
  },
  en: {
    confirmed: { title: 'Confirmation complete', message: 'The security action was confirmed. You can continue safely.', action: 'Continue to sign in' },
    invalid: { title: 'Invalid link', message: 'The link could not be verified. Request a new message and try again.', action: 'Back to sign in' },
    expired: { title: 'Expired link', message: 'The link has expired or can no longer be used. Request a new message.', action: 'Back to sign in' },
    reused: { title: 'Link already used', message: 'This one-time link is no longer available. Request a new message.', action: 'Back to sign in' },
    missing: { title: 'Missing token', message: 'The link is incomplete and no session was created. Request a new message.', action: 'Back to sign in' },
    unsafe: { title: 'Link safely blocked', message: 'The link contained authentication data in an unsupported format. No session was created.', action: 'Back to sign in' },
    invalid_type: { title: 'Invalid confirmation type', message: 'This request type is not supported. Request a new message.', action: 'Back to sign in' },
    invalid_locale: { title: 'Invalid language', message: 'The link language is not supported. Continue through a valid CLADORA route.', action: 'Continue in Romanian' },
  },
  fa: {
    confirmed: { title: 'تأیید با موفقیت انجام شد', message: 'عملیات امنیتی تأیید شد و می‌توانید به‌صورت امن ادامه دهید.', action: 'ادامه به صفحه ورود' },
    invalid: { title: 'پیوند نامعتبر', message: 'این پیوند قابل تأیید نبود. پیام جدیدی درخواست کرده و دوباره تلاش کنید.', action: 'بازگشت به صفحه ورود' },
    expired: { title: 'پیوند منقضی شده است', message: 'این پیوند منقضی شده یا دیگر قابل استفاده نیست. پیام جدیدی درخواست کنید.', action: 'بازگشت به صفحه ورود' },
    reused: { title: 'پیوند قبلاً استفاده شده است', message: 'این پیوند یک‌بارمصرف دیگر در دسترس نیست. پیام جدیدی درخواست کنید.', action: 'بازگشت به صفحه ورود' },
    missing: { title: 'توکن موجود نیست', message: 'پیوند ناقص است و هیچ نشستی ایجاد نشد. پیام جدیدی درخواست کنید.', action: 'بازگشت به صفحه ورود' },
    unsafe: { title: 'پیوند به‌صورت امن مسدود شد', message: 'پیوند شامل اطلاعات ورود با قالب غیرمجاز بود و هیچ نشستی ایجاد نشد.', action: 'بازگشت به صفحه ورود' },
    invalid_type: { title: 'نوع تأیید نامعتبر است', message: 'نوع این درخواست پشتیبانی نمی‌شود. پیام جدیدی درخواست کنید.', action: 'بازگشت به صفحه ورود' },
    invalid_locale: { title: 'زبان پیوند نامعتبر است', message: 'زبان این پیوند پشتیبانی نمی‌شود. از یکی از مسیرهای معتبر کلادورا ادامه دهید.', action: 'ادامه به زبان رومانیایی' },
  },
} as const;

const statuses = new Set<AuthResultStatus>([
  'confirmed',
  'invalid',
  'expired',
  'reused',
  'missing',
  'unsafe',
  'invalid_type',
  'invalid_locale',
]);

export const metadata: Metadata = {
  title: 'CLADORA secure authentication result',
  robots: { index: false, follow: false, nocache: true },
};

export default async function AuthResultPage(props: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { lang: rawLang } = await props.params;
  if (!isSupportedLocale(rawLang)) {
    redirect('/ro/auth-result?status=invalid_locale');
  }

  const lang: Language = rawLang;
  const query = await props.searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status: AuthResultStatus = rawStatus && statuses.has(rawStatus as AuthResultStatus)
    ? rawStatus as AuthResultStatus
    : 'invalid';
  const t = copy[lang][status];
  const successful = status === 'confirmed';
  const Icon = successful ? CheckCircle2 : AlertTriangle;
  const href = status === 'invalid_locale' ? '/ro/login' : `/${lang}/login`;

  return (
    <main
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      className="flex min-h-screen items-center justify-center bg-[#F6F9FC] px-4 pb-24 pt-32"
    >
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
