import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole, hasWorkspaceAssignment } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await props.params;
  const authCtx = await getPlatformAuthContext();

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_FINANCE'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  if (!hasWorkspaceAssignment(authCtx, workspaceId, 'commercial')) {
    return NextResponse.json({ error: 'commercial_assignment_required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { contract_ref, plan_id, currency, start_date, end_date, commercial_terms } = body;

    if (!contract_ref || !start_date) {
      return NextResponse.json({ error: 'missing_contract_parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('platform')
      .from('workspace_contracts')
      .insert({
        customer_workspace_id: workspaceId,
        plan_id: plan_id || null,
        contract_ref,
        currency: currency || 'EUR',
        start_date,
        end_date: end_date || null,
        commercial_terms: commercial_terms || {},
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contract: data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
