import 'server-only';
import { createHmac } from 'node:crypto';

const FINGERPRINT_SALT = 'cladora-submission-fingerprint-salt-2026';
const WINDOW_MINUTES = 15;

interface FingerprintPayload {
  leadType: 'contact' | 'pilot';
  normalizedEmail: string;
  normalizedPhone?: string;
  messageSnippet?: string;
}

/**
 * Computes a rolling 15-minute submission fingerprint using HMAC-SHA256.
 * Catches double submissions or rapid duplicate clicks within 15 minutes,
 * while allowing legitimate subsequent submissions in the future.
 */
export function computeSubmissionFingerprint(payload: FingerprintPayload): string {
  const secret = process.env.LEAD_IP_HASH_SECRET?.trim() || FINGERPRINT_SALT;
  const timeBucket = Math.floor(Date.now() / (WINDOW_MINUTES * 60 * 1000));

  const canonicalInput = [
    payload.leadType,
    payload.normalizedEmail.trim().toLowerCase(),
    (payload.normalizedPhone ?? '').replace(/[\s\-\(\)\.]/g, ''),
    (payload.messageSnippet ?? '').trim().toLowerCase().slice(0, 60),
    timeBucket.toString(),
  ].join('::');

  return createHmac('sha256', secret)
    .update(canonicalInput)
    .digest('hex');
}
