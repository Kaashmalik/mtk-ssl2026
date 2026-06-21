import { auth } from "@clerk/nextjs/server";
import { db, users } from "@mtk/database";
import { eq } from "drizzle-orm";
import { Permission, UserRole, hasPermission } from "./rbac";
import { getTenantFromRequest } from "./tenant";

/**
 * Resolve active tenant ID from request subdomain or user ownership
 */
export async function resolveActiveTenantId(): Promise<string | null> {
  // 1. Try request headers (subdomain)
  try {
    const requestTenant = await getTenantFromRequest();
    if (requestTenant) return requestTenant.id;
  } catch {
    // ignore
  }

  // 2. Try user owned tenant
  try {
    const { getMyTenant } = await import("@/app/actions/tenants");
    const ownedTenant = await getMyTenant();
    if (ownedTenant) return ownedTenant.id;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Get user role and tenant IDs by clerk ID
 */
export async function getUserRoleAndTenantIds(clerkUserId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  
  if (!user) return null;
  
  return {
    role: user.role as UserRole,
    tenantIds: user.tenantIds || [],
  };
}

export async function hasPermissionServer(permission: Permission, tenantId?: string): Promise<boolean> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return false;

  const userRecord = await getUserRoleAndTenantIds(clerkUserId);
  if (!userRecord) return false;

  const { role, tenantIds } = userRecord;

  // Super admin has all permissions
  if (role === "super_admin") return true;

  // Resolve tenant ID if not specified
  const targetTenantId = tenantId || (await resolveActiveTenantId());

  // If a tenantId is specified or resolved, user must belong to that tenant
  if (targetTenantId && !tenantIds.includes(targetTenantId)) {
    return false;
  }

  return hasPermission(role, permission);
}

/**
 * Enforce that the current Clerk user has a specific permission.
 * Throws an error if they do not.
 */
export async function requirePermissionServer(permission: Permission, tenantId?: string): Promise<void> {
  const hasPerm = await hasPermissionServer(permission, tenantId);
  if (!hasPerm) {
    throw new Error(`Forbidden: Missing required permission ${permission}`);
  }
}
