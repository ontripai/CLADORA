import 'server-only';
import { createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';

const DEFAULT_SALT = 'cladora-fallback-ip-salt-production-hardening-2026';

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
 */
export function hashClientIp(ip: string): string {
  const secret = process.env.LEAD_IP_HASH_SECRET?.trim() || DEFAULT_SALT;
  return createHmac('sha256', secret)
    .update(ip.trim().toLowerCase())
    .digest('hex');
}
