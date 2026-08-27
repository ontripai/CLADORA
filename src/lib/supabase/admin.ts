import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { getPublicSupabaseEnv } from './env';

export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith('sb_secret_')) {
    throw new Error('SUPABASE_SECRET_KEY is missing or invalid.');
  }

  const { url } = getPublicSupabaseEnv();
  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
