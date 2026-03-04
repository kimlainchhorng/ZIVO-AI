import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Shortcut {
  key: string;
  action: string;
}

function generateConfig(shortcuts: Shortcut[], framework: string): Record<string, unknown> {
  if (framework === "react") {
    return {
      library: "react-hotkeys-hook",
      code: shortcuts.map((s) => `useHotkeys('${s.key}', () => { /* ${s.action} */ });`).join("\n"),
    };
  }
  if (framework === "vue") {
    return {
      library: "vue-shortkey",
      config: Object.fromEntries(shortcuts.map((s) => [s.key.replace(/\+/g, "-"), s.action])),
    };
  }
  return {
    framework: "vanilla",
    eventListeners: shortcuts.map((s) => ({
      keys: s.key.split("+"),
      action: s.action,
      listener: `document.addEventListener('keydown', (e) => { if (e.key === '${s.key}') { /* ${s.action} */ } });`,
    })),
  };
}

export async function GET() {
  return NextResponse.json({ description: "Keyboard shortcuts configuration generator" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const shortcuts = (body.shortcuts as Shortcut[] | undefined) ?? [];
    const framework = (body.framework as string | undefined) ?? "react";

    if (!Array.isArray(shortcuts)) {
      return NextResponse.json({ error: "shortcuts must be an array" }, { status: 400 });
    }

    const config = generateConfig(shortcuts, framework);
    return NextResponse.json({ config, framework, count: shortcuts.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
