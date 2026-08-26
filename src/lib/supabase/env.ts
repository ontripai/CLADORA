const SUPABASE_URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL';
const SUPABASE_PUBLISHABLE_KEY = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

export type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

function readPublicEnv(): Partial<PublicSupabaseEnv> {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, publishableKey } = readPublicEnv();
  return Boolean(url && publishableKey);
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const { url, publishableKey } = readPublicEnv();

  if (!url || !publishableKey) {
    throw new Error(
      `Missing ${SUPABASE_URL_KEY} or ${SUPABASE_PUBLISHABLE_KEY}. ` +
        'Add the browser-safe Supabase project values to the environment.',
    );
  }

  if (!url.startsWith('https://') || !url.endsWith('.supabase.co')) {
    throw new Error(`${SUPABASE_URL_KEY} must be an HTTPS Supabase project URL.`);
  }

  return { url, publishableKey };
}
