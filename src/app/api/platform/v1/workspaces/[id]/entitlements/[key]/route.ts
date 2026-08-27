import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole, hasWorkspaceAssignment } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string; key: string }> }
) {
  const { id: workspaceId, key: entitlementKey } = await props.params;
  const authCtx = await getPlatformAuthContext();

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_FINANCE', 'PLATFORM_OPERATIONS'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  if (!hasWorkspaceAssignment(authCtx, workspaceId, 'commercial') && !hasWorkspaceAssignment(authCtx, workspaceId, 'workspace')) {
    return NextResponse.json({ error: 'workspace_assignment_required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { value_type, numeric_value, boolean_value, text_value, json_value, override_value_json, override_reason, override_expires_at } = body;

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('platform')
      .from('workspace_entitlements')
      .upsert({
        customer_workspace_id: workspaceId,
        entitlement_key: entitlementKey,
        value_type,
        numeric_value: numeric_value ?? null,
        boolean_value: boolean_value ?? null,
        text_value: text_value ?? null,
        json_value: json_value ?? null,
        override_value_json: override_value_json ?? null,
        override_reason: override_reason ?? null,
        override_expires_at: override_expires_at ?? null,
        override_approved_by: override_value_json ? authCtx.userId : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entitlement: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
