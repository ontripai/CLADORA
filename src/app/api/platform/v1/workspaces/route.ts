import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const authCtx = await getPlatformAuthContext();
  if (!authCtx.isAuthorized || !authCtx.platformUser) {
    return NextResponse.json({ error: 'unauthorized_platform_access' }, { status: 401 });
  }

  const supabase = await createClient();
  let query = supabase.schema('platform').from('customer_workspaces').select('*');

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_AUDITOR'])) {
    const assignedIds = authCtx.assignments.map((a) => a.customer_workspace_id);
    query = query.in('id', assignedIds.length > 0 ? assignedIds : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workspaces: data });
}

export async function POST(request: Request) {
  const authCtx = await getPlatformAuthContext();
  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_OPERATIONS'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tenant_id, workspace_type, commercial_owner, environment } = body;

    if (!tenant_id || !workspace_type || !commercial_owner) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('platform')
      .from('customer_workspaces')
      .insert({
        tenant_id,
        workspace_type,
        commercial_owner,
        environment: environment || 'PILOT',
        lifecycle_status: 'LEAD',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workspace: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
