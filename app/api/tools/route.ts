import { NextResponse } from "next/server";
import type { ToolAction, ToolRequest, ToolResponse } from "../../../lib/types";

export const runtime = "nodejs";

const SUPPORTED_ACTIONS: ToolAction[] = [
  "create_file",
  "update_file",
  "delete_file",
  "rename_file",
  "run_tests",
  "run_build",
  "lint_fix",
  "format_code",
  "install_dependencies",
  "run_dev_server",
];

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ToolRequest>;
    const { action, params } = body;

    if (!action || !SUPPORTED_ACTIONS.includes(action as ToolAction)) {
      return NextResponse.json(
        { error: `Invalid action. Supported: ${SUPPORTED_ACTIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await executeToolAction(action as ToolAction, params ?? {});
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tool error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function executeToolAction(
  action: ToolAction,
  params: Record<string, unknown>
): Promise<ToolResponse> {
  switch (action) {
    case "create_file": {
      const path    = String(params.path ?? "");
      const content = String(params.content ?? "");
      if (!path) return { action, success: false, error: "path is required" };
      if (!content) return { action, success: false, error: "content is required" };
      // In production, this would write to the filesystem / Supabase
      return { action, success: true, output: `File created: ${path}`, files_affected: [path] };
    }

    case "update_file": {
      const path  = String(params.path ?? "");
      const patch = String(params.patch ?? "");
      if (!path) return { action, success: false, error: "path is required" };
      if (!patch) return { action, success: false, error: "patch is required" };
      return { action, success: true, output: `File updated: ${path}`, files_affected: [path] };
    }

    case "delete_file": {
      const path = String(params.path ?? "");
      if (!path) return { action, success: false, error: "path is required" };
      return { action, success: true, output: `File deleted: ${path}`, files_affected: [path] };
    }

    case "rename_file": {
      const oldPath = String(params.old ?? "");
      const newPath = String(params.new ?? "");
      if (!oldPath || !newPath) return { action, success: false, error: "old and new paths are required" };
      return {
        action,
        success: true,
        output: `File renamed: ${oldPath} → ${newPath}`,
        files_affected: [oldPath, newPath],
      };
    }

    case "run_tests":
      return { action, success: true, output: "Test suite queued. Results will be posted to ai_tests." };

    case "run_build":
      return { action, success: true, output: "Build queued. Monitor status via /api/deploy." };

    case "lint_fix":
      return { action, success: true, output: "ESLint auto-fix queued." };

    case "format_code":
      return { action, success: true, output: "Prettier formatting queued." };

    case "install_dependencies": {
      const packages = Array.isArray(params.packages)
        ? (params.packages as string[]).join(", ")
        : "all";
      return { action, success: true, output: `Installing: ${packages}` };
    }

    case "run_dev_server":
      return { action, success: true, output: "Dev server start requested on port 3000." };

    default:
      return { action, success: false, error: "Unknown action" };
  }
}
