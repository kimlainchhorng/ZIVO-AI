// app/api/plugins/route.ts — Plugin Marketplace CRUD API

import { NextResponse } from "next/server";
import {
  getPluginsWithStatus,
  installPlugin,
  uninstallPlugin,
  PLUGIN_REGISTRY,
} from "@/lib/plugins";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ plugins: getPluginsWithStatus() });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, pluginId, config } = body as {
    action?: "install" | "uninstall" | "configure";
    pluginId?: string;
    config?: Record<string, string>;
  };

  if (!action) {
    return NextResponse.json({ error: "action is required: install | uninstall | configure" }, { status: 400 });
  }

  if (!pluginId || typeof pluginId !== "string") {
    return NextResponse.json({ error: "pluginId is required" }, { status: 400 });
  }

  const plugin = PLUGIN_REGISTRY.find((p) => p.id === pluginId);
  if (!plugin) {
    return NextResponse.json({ error: `Plugin "${pluginId}" not found` }, { status: 404 });
  }

  if (action === "install" || action === "configure") {
    try {
      const result = installPlugin(pluginId, config ?? {});
      return NextResponse.json({
        success: true,
        plugin: { ...plugin, installed: true },
        files: result.files,
        instructions: result.instructions,
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: (err as Error)?.message ?? "Failed to install plugin" },
        { status: 500 }
      );
    }
  }

  if (action === "uninstall") {
    uninstallPlugin(pluginId);
    return NextResponse.json({ success: true, plugin: { ...plugin, installed: false } });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
