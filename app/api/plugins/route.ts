import { NextResponse } from "next/server";
import { getPlugins, enablePlugin, disablePlugin, registerPlugin, SAMPLE_PLUGINS, Plugin } from "@/lib/plugin-system";

// Initialize sample plugins on first load
let initialized = false;
function initPlugins() {
  if (!initialized) {
    SAMPLE_PLUGINS.forEach(p => registerPlugin(p));
    initialized = true;
  }
}

export async function GET() {
  try {
    initPlugins();
    return NextResponse.json({ ok: true, plugins: getPlugins() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to fetch plugins";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    initPlugins();
    const body = await req.json().catch(() => ({}));
    const { action, id, plugin } = body;

    if (action === 'enable') {
      const ok = enablePlugin(id);
      return NextResponse.json({ ok });
    }
    if (action === 'disable') {
      const ok = disablePlugin(id);
      return NextResponse.json({ ok });
    }
    if (action === 'install' && plugin) {
      registerPlugin({ ...(plugin as Plugin), enabled: false });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Plugin operation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
