import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: assignmentId } = await props.params;
  const authCtx = await getPlatformAuthContext();

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_OPERATIONS'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { revoke_reason } = body;

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('platform')
      .from('platform_customer_assignments')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: authCtx.userId,
        revoke_reason: revoke_reason || 'Manual revocation by operator',
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assignment: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message || 'invalid_request' }, { status: 400 });
  }
}
