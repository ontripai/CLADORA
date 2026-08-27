import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, private',
};

export async function POST(request: Request) {
  const authCtx = await getPlatformAuthContext();
  if (!authCtx.isAuthorized || !authCtx.platformUser) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED_PLATFORM_ACCESS', message: 'Authentication required' } },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_OPERATIONS'])) {
    return NextResponse.json(
      { error: { code: 'INSUFFICIENT_ROLE_PRIVILEGES', message: 'Operations or Super Admin role required' } },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const body = await request.json();
    const { platform_user_id, customer_workspace_id, scope_type, scope_id, assignment_reason, valid_until } = body;

    if (!platform_user_id || !customer_workspace_id || !assignment_reason || typeof assignment_reason !== 'string' || assignment_reason.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_ASSIGNMENT_PARAMETERS', message: 'platform_user_id, customer_workspace_id, and non-empty assignment_reason are required' } },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('grant_customer_assignment', {
      p_platform_user_id: platform_user_id,
      p_customer_workspace_id: customer_workspace_id,
      p_scope_type: scope_type || 'workspace',
      p_scope_id: scope_id || null,
      p_valid_until: valid_until || null,
      p_reason: assignment_reason.trim(),
    });

    if (error) {
      if (error.message.includes('access_denied')) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN_ASSIGNMENT', message: 'Insufficient privileges or unassigned operator attempting delegation.' } },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }
      return NextResponse.json(
        { error: { code: 'ASSIGNMENT_GRANT_FAILED', message: 'Failed to grant customer assignment.' } },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json({ assignment: data }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: { code: 'MALFORMED_JSON', message: 'Invalid JSON request body' } },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }
}
