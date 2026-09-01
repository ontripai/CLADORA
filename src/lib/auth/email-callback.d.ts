import type { EmailOtpType } from '@supabase/supabase-js';

export type SupportedAuthEmailType = Extract<
  EmailOtpType,
  'email' | 'invite' | 'magiclink' | 'recovery' | 'signup' | 'email_change'
>;

export const AUTH_EMAIL_TYPES: readonly SupportedAuthEmailType[];
export function isSupportedLocale(value: unknown): value is 'ro' | 'en' | 'fa';
export function isSupportedAuthEmailType(value: unknown): value is SupportedAuthEmailType;
export function hasForbiddenAuthQuery(searchParams: URLSearchParams): boolean;
export function hasDuplicateCallbackParameters(searchParams: URLSearchParams): boolean;
export function resolveAuthEmailDestination(
  lang: string,
  type: SupportedAuthEmailType,
  rawNext: string | null,
): string | null;
export function mapOtpErrorStatus(code: string | undefined): 'expired' | 'invalid';
