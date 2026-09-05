import 'server-only';
import type { NextRequest } from 'next/server';

const PRODUCTION_ORIGIN = 'https://cladora.ro';

export function isAllowedOrigin(originHeader: string | null): boolean {
  if (!originHeader) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(originHeader);
  } catch {
    return false;
  }

  // 1. Primary Production Domain
  if (originUrl.origin === PRODUCTION_ORIGIN) return true;

  // 2. Configured Site Origin from Env
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      if (originUrl.origin === new URL(siteUrl).origin) return true;
    } catch {
      // ignore malformed env URL
    }
  }

  // 3. Vercel Preview Deployments
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && originUrl.origin === `https://${vercelUrl}`) return true;

  // Pattern-match valid Cladora Vercel preview environments
  if (
    originUrl.protocol === 'https:' &&
    (originUrl.hostname.endsWith('.vercel.app') &&
      (originUrl.hostname.startsWith('cladora-') || originUrl.hostname.includes('ontrip')))
  ) {
    return true;
  }

  // 4. Local Development
  if (process.env.NODE_ENV !== 'production') {
    if (
      (originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1') &&
      (originUrl.protocol === 'http:' || originUrl.protocol === 'https:')
    ) {
      return true;
    }
  }

  return false;
}

export function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return isAllowedOrigin(origin);
}
