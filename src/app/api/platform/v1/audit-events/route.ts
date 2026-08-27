import { NextResponse } from 'next/server';
import { getPlatformAuthContext, hasPlatformRole } from '@/lib/platform/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const authCtx = await getPlatformAuthContext();

  if (!hasPlatformRole(authCtx, ['PLATFORM_SUPER_ADMIN', 'PLATFORM_AUDITOR'])) {
    return NextResponse.json({ error: 'insufficient_role_privileges' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema('audit')
    .from('events')
    .select('*')
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data });
}
