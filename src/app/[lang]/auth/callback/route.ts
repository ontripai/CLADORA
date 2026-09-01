import { NextResponse, type NextRequest } from 'next/server';
import {
  hasDuplicateCallbackParameters,
  hasForbiddenAuthQuery,
  isSupportedAuthEmailType,
  isSupportedLocale,
  mapOtpErrorStatus,
  resolveAuthEmailDestination,
} from '@/lib/auth/email-callback.mjs';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_QUERY_KEYS = new Set(['token_hash', 'type', 'next']);
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, private',
  'CDN-Cache-Control': 'no-store',
  'Surrogate-Control': 'no-store',
  Pragma: 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  Vary: 'Cookie',
};

function noStore(response: NextResponse): NextResponse {
  Object.entries(NO_STORE_HEADERS).forEach(([name, value]) => response.headers.set(name, value));
  return response;
}

function resultUrl(request: NextRequest, lang: string, status: string): URL {
  const locale = isSupportedLocale(lang) ? lang : 'ro';
  return new URL(`/${locale}/auth-result?status=${status}`, request.url);
}

function reject(request: NextRequest, lang: string, status: string): NextResponse {
  return noStore(NextResponse.redirect(resultUrl(request, lang, status)));
}

function hasUnexpectedQuery(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key)) return true;
  }
  return false;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ lang: string }> },
) {
  const { lang } = await props.params;
  if (!isSupportedLocale(lang)) {
    return reject(request, 'ro', 'invalid_locale');
  }

  const searchParams = request.nextUrl.searchParams;
  if (
    hasForbiddenAuthQuery(searchParams) ||
    hasDuplicateCallbackParameters(searchParams) ||
    hasUnexpectedQuery(searchParams)
  ) {
    return reject(request, lang, 'unsafe');
  }

  const tokenHash = searchParams.get('token_hash');
  if (!tokenHash || tokenHash.length < 16 || tokenHash.length > 256 || /\s/.test(tokenHash)) {
    return reject(request, lang, 'missing');
  }

  const rawType = searchParams.get('type');
  if (!isSupportedAuthEmailType(rawType)) {
    return reject(request, lang, 'invalid_type');
  }

  const destination = resolveAuthEmailDestination(lang, rawType, searchParams.get('next'));
  if (!destination) {
    return reject(request, lang, 'unsafe');
  }

  const supabase = await createClient();
  const verification = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: rawType,
  });

  if (verification.error) {
    return reject(request, lang, mapOtpErrorStatus(verification.error.code));
  }

  return noStore(NextResponse.redirect(new URL(destination, request.url)));
}
