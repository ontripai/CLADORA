import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.generated';
import { getPublicSupabaseEnv, isSupabaseConfigured } from './env';

const APP_PATH = /^\/(ro|en|fa)\/app(?:\/|$)/;

function loginUrl(request: NextRequest, reason?: string) {
  const locale = request.nextUrl.pathname.split('/')[1] || 'ro';
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/login`;
  url.search = '';
  url.searchParams.set('next', request.nextUrl.pathname);
  if (reason) url.searchParams.set('reason', reason);
  return url;
}

export async function updateSession(request: NextRequest) {
  const isProtectedRoute = APP_PATH.test(request.nextUrl.pathname);

  if (!isSupabaseConfigured()) {
    return isProtectedRoute
      ? NextResponse.redirect(loginUrl(request, 'configuration'))
      : NextResponse.next({ request });
  }

  const { url, publishableKey } = getPublicSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  // getClaims validates the JWT signature. Never trust getSession in middleware.
  const { data, error } = await supabase.auth.getClaims();

  if (isProtectedRoute && (error || !data?.claims)) {
    return NextResponse.redirect(loginUrl(request));
  }

  return response;
}
