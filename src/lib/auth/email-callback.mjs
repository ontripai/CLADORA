const LANGUAGES = Object.freeze(['ro', 'en', 'fa']);
export const AUTH_EMAIL_TYPES = Object.freeze([
  'email',
  'invite',
  'magiclink',
  'recovery',
  'signup',
  'email_change',
]);

const FORBIDDEN_AUTH_QUERY_KEYS = new Set([
  'access_token',
  'refresh_token',
  'provider_token',
  'provider_refresh_token',
  'session',
  'session_id',
  'token',
  'code',
]);

const DEFAULT_DESTINATIONS = {
  email: (lang) => `/${lang}/auth-result?status=confirmed`,
  invite: (lang) => `/${lang}/invitation-continuation`,
  magiclink: (lang) => `/${lang}/app/dashboard`,
  recovery: (lang) => `/${lang}/reset-password`,
  signup: (lang) => `/${lang}/auth-result?status=confirmed`,
  email_change: (lang) => `/${lang}/auth-result?status=confirmed`,
};

const ALLOWED_NEXT_PATHS = {
  email: (lang) => [`/${lang}/app/dashboard`],
  invite: (lang) => [`/${lang}/invitation-continuation`],
  magiclink: (lang) => [`/${lang}/app/dashboard`],
  recovery: (lang) => [`/${lang}/reset-password`],
  signup: (lang) => [`/${lang}/app/dashboard`],
  email_change: (lang) => [`/${lang}/app/settings`],
};

export function isSupportedLocale(value) {
  return typeof value === 'string' && LANGUAGES.includes(value);
}

export function isSupportedAuthEmailType(value) {
  return typeof value === 'string' && AUTH_EMAIL_TYPES.includes(value);
}

export function hasForbiddenAuthQuery(searchParams) {
  for (const key of searchParams.keys()) {
    if (FORBIDDEN_AUTH_QUERY_KEYS.has(key.toLowerCase())) return true;
  }
  return false;
}

export function hasDuplicateCallbackParameters(searchParams) {
  return ['token_hash', 'type', 'next'].some((key) => searchParams.getAll(key).length > 1);
}

export function resolveAuthEmailDestination(lang, type, rawNext) {
  if (!isSupportedLocale(lang) || !isSupportedAuthEmailType(type)) return null;
  if (!rawNext) return DEFAULT_DESTINATIONS[type](lang);
  if (!rawNext.startsWith('/') || rawNext.startsWith('//')) return null;

  let parsed;
  try {
    parsed = new URL(rawNext, 'https://callback.invalid');
  } catch {
    return null;
  }

  if (
    parsed.origin !== 'https://callback.invalid' ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    return null;
  }

  return ALLOWED_NEXT_PATHS[type](lang).includes(parsed.pathname) ? parsed.pathname : null;
}

export function mapOtpErrorStatus(code) {
  return code === 'otp_expired' ? 'expired' : 'invalid';
}
