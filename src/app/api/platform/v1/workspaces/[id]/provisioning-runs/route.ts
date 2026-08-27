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
    return NextResponse.json({ error: 'workspace_assignment_required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { idempotency_key, task_types } = body;

    if (!idempotency_key || !Array.isArray(task_types)) {
      return NextResponse.json({ error: 'missing_provisioning_parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_provisioning_run', {
      p_workspace_id: workspaceId,
      p_idempotency_key: idempotency_key,
      p_task_types: task_types,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ run: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
