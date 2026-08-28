import { createClient } from '@/lib/supabase/server';
import type {
  PlatformAuthContext,
  PlatformRole,
  PlatformUser,
  PlatformRoleAssignment,
  PlatformCustomerAssignment,
  ScopeType,
} from '@/types/platform';

export async function getPlatformAuthContext(): Promise<PlatformAuthContext> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      userId: '',
      platformUser: null,
      roles: [],
      assignments: [],
      assuranceLevel: null,
      isAuthorized: false,
    };
  }

  const userId = claimsData.claims.sub;
  const assuranceLevel = claimsData.claims.aal === 'aal2' ? 'aal2' : 'aal1';

  const { data: userData, error: userError } = await supabase
    .schema('platform')
    .from('platform_users')
    .select('*')
    .eq('auth_user_id', userId)
    .eq('status', 'active')
    .is('deactivated_at', null)
    .maybeSingle();

  if (userError || !userData) {
    return {
      userId,
      platformUser: null,
      roles: [],
      assignments: [],
      assuranceLevel,
      isAuthorized: false,
    };
  }

  const platformUser = userData as unknown as PlatformUser;

  const now = new Date().toISOString();
  const { data: rolesData } = await supabase
    .schema('platform')
    .from('platform_role_assignments')
    .select('*')
    .eq('platform_user_id', platformUser.id)
    .eq('status', 'active')
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gt.${now}`);

  const activeRoleAssignments = (rolesData || []) as unknown as PlatformRoleAssignment[];
  const roles = activeRoleAssignments.map((ra) => ra.role);

  const { data: assignmentsData } = await supabase
    .schema('platform')
    .from('platform_customer_assignments')
    .select('*')
    .eq('platform_user_id', platformUser.id)
    .eq('status', 'active')
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gt.${now}`);

  const assignments = (assignmentsData || []) as unknown as PlatformCustomerAssignment[];

  const isAuthorized = roles.length > 0;

  return {
    userId,
    platformUser,
    roles,
    assignments,
    assuranceLevel,
    isAuthorized,
  };
}

export function hasPlatformAal2(ctx: PlatformAuthContext): boolean {
  return ctx.isAuthorized && ctx.assuranceLevel === 'aal2';
}

export function hasPlatformRole(
  ctx: PlatformAuthContext,
  requiredRole: PlatformRole | PlatformRole[]
): boolean {
  if (!ctx.isAuthorized || !ctx.platformUser) return false;
  const targetRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return targetRoles.some((r) => ctx.roles.includes(r));
}

export function hasWorkspaceAssignment(
  ctx: PlatformAuthContext,
  workspaceId: string,
  requiredScope: ScopeType = 'workspace'
): boolean {
  if (!ctx.isAuthorized || !ctx.platformUser) return false;

  if (ctx.roles.includes('PLATFORM_SUPER_ADMIN') || ctx.roles.includes('PLATFORM_AUDITOR')) {
    return true;
  }

  return ctx.assignments.some(
    (a) =>
      a.customer_workspace_id === workspaceId &&
      (a.scope_type === requiredScope || a.scope_type === 'workspace')
  );
}
