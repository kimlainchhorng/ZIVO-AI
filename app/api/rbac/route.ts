export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

interface Role {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
}

interface UserRole {
  userId: string;
  email: string;
  role: string;
  assignedAt: string;
}

const VALID_ROLES = ["admin", "editor", "viewer", "developer", "auditor"];

const mockRoles: Role[] = [
  {
    id: "role_001",
    name: "admin",
    permissions: ["read", "write", "delete", "manage_users", "manage_roles", "billing"],
    userCount: 3,
  },
  {
    id: "role_002",
    name: "developer",
    permissions: ["read", "write", "deploy", "view_logs", "manage_agents"],
    userCount: 11,
  },
  {
    id: "role_003",
    name: "editor",
    permissions: ["read", "write", "manage_prompts", "manage_kb"],
    userCount: 8,
  },
  {
    id: "role_004",
    name: "viewer",
    permissions: ["read"],
    userCount: 24,
  },
  {
    id: "role_005",
    name: "auditor",
    permissions: ["read", "view_logs", "export_reports"],
    userCount: 2,
  },
];

const mockUserRoles: UserRole[] = [
  { userId: "usr_a1b2", email: "alice@zivo.ai", role: "admin", assignedAt: "2025-09-01T10:00:00Z" },
  {
    userId: "usr_c3d4",
    email: "bob@zivo.ai",
    role: "developer",
    assignedAt: "2025-10-15T09:30:00Z",
  },
  {
    userId: "usr_e5f6",
    email: "carol@zivo.ai",
    role: "editor",
    assignedAt: "2025-11-20T14:00:00Z",
  },
  {
    userId: "usr_g7h8",
    email: "dave@zivo.ai",
    role: "viewer",
    assignedAt: "2026-01-05T08:00:00Z",
  },
];

export async function GET() {
  try {
    return NextResponse.json({ roles: mockRoles, users: mockUserRoles });
  } catch {
    return NextResponse.json({ error: "Failed to fetch RBAC data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, role } = body as {
      action?: string;
      userId?: string;
      role?: string;
    };

    if (!action || !userId || !role) {
      return NextResponse.json(
        { error: "Missing required fields: action, userId, role" },
        { status: 400 }
      );
    }

    if (action !== "assign" && action !== "revoke") {
      return NextResponse.json(
        { error: 'Invalid action. Must be "assign" or "revoke"' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    const message =
      action === "assign"
        ? `Role "${role}" successfully assigned to user ${userId}`
        : `Role "${role}" successfully revoked from user ${userId}`;

    return NextResponse.json({ success: true, message });
  } catch {
    return NextResponse.json({ error: "Failed to update role assignment" }, { status: 500 });
  }
}
