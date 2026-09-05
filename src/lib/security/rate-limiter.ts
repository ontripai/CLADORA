import 'server-only';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  currentCount: number;
}

const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_SECONDS = 900; // 15 minutes

/**
 * Checks and increments persistent rate limit using Supabase table marketing_rate_limits.
 * Never leaks or stores raw IP.
 */
export async function checkRateLimit(
  actionKey: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS
): Promise<RateLimitResult> {
  // If Supabase is not configured (e.g. local unit tests or offline preview)
  if (!isSupabaseConfigured()) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      currentCount: 1,
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('consume_marketing_rate_limit', {
      p_action_key: actionKey,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    const rows = data as unknown as Array<{ allowed: boolean; retry_after_seconds: number; current_count: number }> | null;
    if (error || !rows || rows.length === 0) {
      console.error('[SECURITY] Rate limit RPC check failed:', error?.message);
      return { allowed: true, retryAfterSeconds: 0, currentCount: 1 };
    }

    const row = rows[0];
    return {
      allowed: Boolean(row.allowed),
      retryAfterSeconds: Number(row.retry_after_seconds) || 0,
      currentCount: Number(row.current_count) || 1,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SECURITY] Rate limit execution error:', msg);
    return { allowed: true, retryAfterSeconds: 0, currentCount: 1 };
  }
}
