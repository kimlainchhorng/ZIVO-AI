import { NextResponse } from "next/server";
import type { ToolAction, ToolResult } from "../../../lib/types";

export const runtime = "nodejs";

// POST /api/tool-actions
// Body: { actions: ToolAction[] }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { actions } = body;

    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: "actions array is required" },
        { status: 400 }
      );
    }

    const results: ToolResult[] = [];

    for (const action of actions as ToolAction[]) {
      const result = await executeAction(action);
      results.push(result);
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function executeAction(action: ToolAction): Promise<ToolResult> {
  switch (action.type) {
    case "create_file":
      return {
        action: action.type,
        success: true,
        output: `File ${action.path} queued for creation (${action.content.length} chars)`,
      };

    case "update_file":
      return {
        action: action.type,
        success: true,
        output: `File ${action.path} queued for update`,
      };

    case "delete_file":
      return {
        action: action.type,
        success: true,
        output: `File ${action.path} queued for deletion`,
      };

    case "rename_file":
      return {
        action: action.type,
        success: true,
        output: `File rename queued: ${action.old_path} → ${action.new_path}`,
      };

    case "run_tests":
      return {
        action: action.type,
        success: true,
        output: "Test run queued",
      };

    case "run_build":
      return {
        action: action.type,
        success: true,
        output: "Build queued",
      };

    case "lint_fix":
      return {
        action: action.type,
        success: true,
        output: "Lint fix queued",
      };

    case "format_code":
      return {
        action: action.type,
        success: true,
        output: "Code format queued",
      };

    case "install_dependencies":
      return {
        action: action.type,
        success: true,
        output: `Dependency install queued: ${action.packages.join(", ")}`,
      };

    case "run_dev_server":
      return {
        action: action.type,
        success: true,
        output: "Dev server start queued",
      };

    default:
      return {
        action: (action as ToolAction).type,
        success: false,
        output: "",
        error: `Unknown action type: ${(action as { type: string }).type}`,
      };
  }
}
