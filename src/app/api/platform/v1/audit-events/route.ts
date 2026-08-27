import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, private',
};

export async function GET(request: Request) {
  const authCtx = await getPlatformAuthContext();

  if (!authCtx.isAuthorized || !authCtx.platformUser) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED_PLATFORM_ACCESS', message: 'Authentication required' } },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_AUDITOR'])) {
    return NextResponse.json(
      { error: { code: 'INSUFFICIENT_ROLE_PRIVILEGES', message: 'Super Admin or Auditor role required' } },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 1), 100);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const supabase = await createClient();
  const { data, count, error } = await supabase
    .schema('audit')
    .from('events')
    .select('*', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DATABASE_QUERY_FAILED', message: 'Failed to retrieve audit events' } },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    {
      events: data,
      pagination: {
        total: count ?? 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count ?? 0),
      },
    },
    { status: 200, headers: NO_CACHE_HEADERS }
  );
}
