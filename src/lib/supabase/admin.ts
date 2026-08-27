import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.generated';
import { getPublicSupabaseEnv } from './env';
import { getServerSupabaseSecret } from './server-env';

export function createAdminClient() {
  const { url } = getPublicSupabaseEnv();
  return createClient<Database>(url, getServerSupabaseSecret(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
