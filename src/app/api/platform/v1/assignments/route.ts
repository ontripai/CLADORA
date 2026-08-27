import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const authCtx = await getPlatformAuthContext();
  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_OPERATIONS'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { platform_user_id, customer_workspace_id, scope_type, scope_id, assignment_reason, valid_until } = body;

    if (!platform_user_id || !customer_workspace_id || !assignment_reason) {
      return NextResponse.json({ error: 'missing_assignment_parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('platform')
      .from('platform_customer_assignments')
      .insert({
        platform_user_id,
        customer_workspace_id,
        scope_type: scope_type || 'workspace',
        scope_id: scope_id || null,
        assignment_reason,
        assigned_by: authCtx.userId,
        valid_until: valid_until || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
