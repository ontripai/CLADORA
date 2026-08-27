import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const LANGUAGES = new Set(['ro', 'en', 'fa']);
const OTP_TYPES = new Set<EmailOtpType>([
  'email',
  'invite',
  'magiclink',
  'recovery',
  'signup',
  'email_change',
]);

function safeNext(value: string | null, lang: string): string {
  const fallback = `/${lang}/login`;
  if (!value || !value.startsWith(`/${lang}/`) || value.startsWith('//')) return fallback;
  return value;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string }> },
) {
  const { lang } = await props.params;
  if (!LANGUAGES.has(lang)) {
    return NextResponse.redirect(new URL('/ro/login?reason=invalid_callback', request.url));
  }

  const next = safeNext(request.nextUrl.searchParams.get('next'), lang);
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const rawType = request.nextUrl.searchParams.get('type');
  const supabase = await createClient();

  let error: Error | null = null;
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else if (tokenHash && rawType && OTP_TYPES.has(rawType as EmailOtpType)) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: rawType as EmailOtpType,
    });
    error = result.error;
  } else {
    error = new Error('Missing callback credentials');
  }

  if (error) {
    return NextResponse.redirect(new URL(`/${lang}/login?reason=invalid_callback`, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
