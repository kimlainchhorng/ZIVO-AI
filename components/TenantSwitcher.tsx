"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Plus, Settings, Users, LogOut } from "lucide-react";

export type TenantRole = "owner" | "admin" | "member" | "viewer";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  role: TenantRole;
  memberCount: number;
}

export interface TenantSwitcherProps {
  tenants: Tenant[];
  currentTenantId: string;
  onSwitch: (tenantId: string) => void;
  onCreateTenant?: () => void;
  onInviteMembers?: (tenantId: string) => void;
  onManageRoles?: (tenantId: string) => void;
}

const ROLE_LABELS: Record<TenantRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<TenantRole, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  member: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function TenantAvatar({ tenant, size = "md" }: { tenant: Tenant; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };
  if (tenant.logoUrl) {
    return (
      <Image
        src={tenant.logoUrl}
        alt={tenant.name}
        width={size === "lg" ? 40 : size === "md" ? 32 : 24}
        height={size === "lg" ? 40 : size === "md" ? 32 : 24}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-white`}
    >
      {tenant.name.charAt(0).toUpperCase()}
    </div>
  );
}

/** TenantSwitcher — Switch between organizations/workspaces with role management. */
export function TenantSwitcher({
  tenants,
  currentTenantId,
  onSwitch,
  onCreateTenant,
  onInviteMembers,
  onManageRoles,
}: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);

  const current = tenants.find((t) => t.id === currentTenantId) ?? tenants[0];

  const canInvite = current && (current.role === "owner" || current.role === "admin");
  const canManageRoles = current && (current.role === "owner" || current.role === "admin");

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current && <TenantAvatar tenant={current} size="sm" />}
        <span className="max-w-[140px] truncate">{current?.name ?? "Select workspace"}</span>
        {current && (
          <span
            className={`hidden rounded px-1.5 py-0.5 text-xs font-medium sm:inline-flex ${ROLE_COLORS[current.role]}`}
          >
            {ROLE_LABELS[current.role]}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 z-20 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            role="listbox"
            aria-label="Workspace list"
          >
            <div className="p-1">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Workspaces
              </p>
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  role="option"
                  aria-selected={tenant.id === currentTenantId}
                  onClick={() => {
                    onSwitch(tenant.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    tenant.id === currentTenantId
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <TenantAvatar tenant={tenant} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tenant.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {tenant.memberCount} member{tenant.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${ROLE_COLORS[tenant.role]}`}>
                    {ROLE_LABELS[tenant.role]}
                  </span>
                </button>
              ))}
            </div>

            {(canInvite || canManageRoles || onCreateTenant) && (
              <div className="border-t border-gray-100 p-1 dark:border-gray-700">
                {canInvite && onInviteMembers && current && (
                  <button
                    type="button"
                    onClick={() => {
                      onInviteMembers(current.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Users className="h-4 w-4 text-gray-400" />
                    Invite team members
                  </button>
                )}
                {canManageRoles && onManageRoles && current && (
                  <button
                    type="button"
                    onClick={() => {
                      onManageRoles(current.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    Manage roles
                  </button>
                )}
                {onCreateTenant && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateTenant();
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                  >
                    <Plus className="h-4 w-4" />
                    Create new workspace
                  </button>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 p-1 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TenantSwitcher;
