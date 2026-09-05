import { createHmac } from 'node:crypto';

export const FINGERPRINT_WINDOW_MINUTES = 15;

export interface FingerprintPayload {
  leadType: 'contact' | 'pilot';
  normalizedEmail: string;
  normalizedPhone?: string;
  messageSnippet?: string;
}

export interface FingerprintResult {
  fingerprint: string;
  bucket: number;
}

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

/**
 * Computes a rolling 15-minute submission fingerprint using HMAC-SHA256.
 * Catches double submissions or rapid duplicate clicks within 15 minutes,
 * while allowing legitimate subsequent submissions in the future.
 *
 * Uses a validated secret with a minimum length of 32 characters.
 */
export function computeSubmissionFingerprint(
  payload: FingerprintPayload,
  explicitBucket?: number
): FingerprintResult {
  const secret = getLeadSecuritySecret();
  const bucket =
    explicitBucket !== undefined
      ? explicitBucket
      : Math.floor(Date.now() / (FINGERPRINT_WINDOW_MINUTES * 60 * 1000));

  const canonicalInput = [
    payload.leadType,
    payload.normalizedEmail.trim().toLowerCase(),
    (payload.normalizedPhone ?? '').replace(/[\s\-\(\)\.]/g, ''),
    (payload.messageSnippet ?? '').trim().toLowerCase().slice(0, 60),
    bucket.toString(),
  ].join('::');

  const fingerprint = createHmac('sha256', secret)
    .update(canonicalInput)
    .digest('hex');

  return { fingerprint, bucket };
}
