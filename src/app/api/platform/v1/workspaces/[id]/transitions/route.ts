import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole, hasWorkspaceAssignment } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, private',
};

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await props.params;
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

  if (!hasWorkspaceAssignment(authCtx, workspaceId, 'workspace')) {
    return NextResponse.json(
      { error: { code: 'WORKSPACE_ASSIGNMENT_REQUIRED', message: 'Explicit customer workspace assignment required' } },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const body = await request.json();
    const { target_status, expected_version, reason } = body;

    if (!target_status || typeof expected_version !== 'number' || !reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_TRANSITION_PARAMETERS', message: 'target_status, integer expected_version, and non-empty reason are required' } },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('transition_workspace_lifecycle', {
      p_workspace_id: workspaceId,
      p_target_status: target_status,
      p_expected_version: expected_version,
      p_reason: reason.trim(),
    });

    if (error) {
      if (error.message.includes('concurrency_conflict')) {
        return NextResponse.json(
          { error: { code: 'CONCURRENCY_CONFLICT', message: 'Workspace version has changed. Please refresh and retry.' } },
          { status: 409, headers: NO_CACHE_HEADERS }
        );
      }
      if (error.message.includes('illegal_transition')) {
        return NextResponse.json(
          { error: { code: 'ILLEGAL_TRANSITION', message: 'Requested lifecycle state transition is not permitted.' } },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      if (error.message.includes('activation_blocked')) {
        return NextResponse.json(
          { error: { code: 'ACTIVATION_BLOCKED', message: 'Production activation requires completed primary administrator invitation (ENG-010).' } },
          { status: 422, headers: NO_CACHE_HEADERS }
        );
      }
      if (error.message.includes('access_denied')) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN_TRANSITION', message: 'Insufficient privileges for target lifecycle transition.' } },
          { status: 403, headers: NO_CACHE_HEADERS }
        );
      }

      return NextResponse.json(
        { error: { code: 'TRANSITION_EXECUTION_FAILED', message: 'Failed to execute lifecycle transition.' } },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json({ workspace: data }, { status: 200, headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: { code: 'MALFORMED_JSON', message: 'Invalid JSON request body' } },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }
}
