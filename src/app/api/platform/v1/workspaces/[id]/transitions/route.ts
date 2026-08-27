import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole, hasWorkspaceAssignment } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await props.params;
  const authCtx = await getPlatformAuthContext();

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_OPERATIONS'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  if (!hasWorkspaceAssignment(authCtx, workspaceId, 'workspace')) {
    return NextResponse.json({ error: 'customer_assignment_required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { target_status, expected_version, reason } = body;

    if (!target_status || expected_version === undefined || !reason) {
      return NextResponse.json({ error: 'missing_transition_parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('transition_workspace_lifecycle', {
      p_workspace_id: workspaceId,
      p_target_status: target_status,
      p_expected_version: expected_version,
      p_reason: reason,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ workspace: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
