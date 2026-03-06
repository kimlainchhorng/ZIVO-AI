export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { hasPermission, type Role, type Action, type Resource } from "@/lib/rbac";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    role?: string;
    action?: string;
    resource?: string;
  };
  const { role, action, resource } = body;
  if (!role || !action || !resource) {
    return NextResponse.json({ error: "role, action, and resource are required" }, { status: 400 });
  }
  const allowed = hasPermission(role as Role, action as Action, resource as Resource);
  return NextResponse.json({ role, action, resource, allowed });
}
