import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Retrieves and validates the HMAC secret key.
 * Fail-closed in Production and Preview if missing or shorter than 32 characters.
 */
export function getLeadSecuritySecret(): string {
  const secret = process.env.LEAD_IP_HASH_SECRET?.trim();
  const isProductionOrPreview =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview';

  if (!secret || secret.length < 32) {
    if (isProductionOrPreview) {
      throw new Error(
        'SECURITY_CONFIG_ERROR: LEAD_IP_HASH_SECRET is not configured or is fewer than 32 characters. Cannot process lead HMAC operations safely.'
      );
    }

    const allowDevFallback =
      process.env.ALLOW_DEV_FALLBACK_SECRET === 'true' ||
      process.env.NODE_ENV === 'test';

    if (allowDevFallback) {
      return 'dev-only-mock-secret-for-local-testing-32-chars';
    }

    throw new Error(
      'SECURITY_CONFIG_ERROR: LEAD_IP_HASH_SECRET is required (min 32 chars). Set ALLOW_DEV_FALLBACK_SECRET=true for offline development.'
    );
  }

  return secret;
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Computes a privacy-safe, irreversible HMAC-SHA256 hash of the client IP.
 * Never stores or leaks raw IP addresses.
 * Uses a validated secret with a minimum length of 32 characters.
 */
export function hashClientIp(ip: string): string {
  const secret = getLeadSecuritySecret();
  return createHmac('sha256', secret)
    .update(ip.trim().toLowerCase())
    .digest('hex');
}
