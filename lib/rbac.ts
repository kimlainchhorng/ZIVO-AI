// lib/rbac.ts — Role-Based Access Control

export type Role = "admin" | "developer" | "viewer" | "billing";
export type Action = "read" | "write" | "delete" | "execute" | "manage";
export type Resource =
  | "builder"
  | "agent"
  | "files"
  | "secrets"
  | "users"
  | "billing"
  | "logs"
  | "jobs"
  | "workflows"
  | "deployments"
  | "settings";

export interface Permission {
  role: Role;
  action: Action;
  resource: Resource;
}

// ─── Permission matrix ────────────────────────────────────────────────────────

const PERMISSIONS: Permission[] = [
  // Admin — full access to everything
  ...["builder", "agent", "files", "secrets", "users", "billing", "logs", "jobs", "workflows", "deployments", "settings"].flatMap(
    (res) =>
      (["read", "write", "delete", "execute", "manage"] as Action[]).map((act) => ({
        role: "admin" as Role,
        action: act,
        resource: res as Resource,
      }))
  ),

  // Developer — can build, deploy, manage files/workflows but not users/billing
  ...["builder", "agent", "files", "logs", "jobs", "workflows", "deployments"].flatMap((res) =>
    (["read", "write", "execute"] as Action[]).map((act) => ({
      role: "developer" as Role,
      action: act,
      resource: res as Resource,
    }))
  ),
  { role: "developer", action: "delete", resource: "files" },
  { role: "developer", action: "delete", resource: "jobs" },

  // Viewer — read-only on safe resources
  ...["builder", "files", "logs", "workflows"].map((res) => ({
    role: "viewer" as Role,
    action: "read" as Action,
    resource: res as Resource,
  })),

  // Billing — can read/manage billing, read usage
  { role: "billing", action: "read", resource: "billing" },
  { role: "billing", action: "manage", resource: "billing" },
  { role: "billing", action: "read", resource: "logs" },
];

/**
 * Returns true if the given role has permission to perform the action on the resource.
 */
export function hasPermission(role: Role, action: Action, resource: Resource): boolean {
  return PERMISSIONS.some(
    (p) => p.role === role && p.action === action && p.resource === resource
  );
}

export interface NextMiddlewareConfig {
  matcher: string[];
}

/**
 * Generates a Next.js middleware config that protects routes based on required role.
 * The config can be used as the `config` export in a middleware file.
 */
export function generateRBACMiddleware(requiredRole: Role): NextMiddlewareConfig {
  const roleMatchers: Record<Role, string[]> = {
    admin: ["/api/:path*", "/dashboard/:path*"],
    developer: ["/api/builder/:path*", "/api/agent/:path*", "/api/deploy/:path*"],
    viewer: ["/api/logs/:path*"],
    billing: ["/api/usage/:path*", "/dashboard/billing/:path*"],
  };

  return {
    matcher: roleMatchers[requiredRole] ?? ["/api/:path*"],
  };
}

/**
 * Returns all permissions for a given role.
 */
export function getRolePermissions(role: Role): Permission[] {
  return PERMISSIONS.filter((p) => p.role === role);
}
