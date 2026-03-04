import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface PluginSystemFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GeneratePluginSystemRequest {
  appName?: string;
  pluginTypes?: Array<"analytics" | "chatbot" | "feedback" | "payments" | "custom">;
  sandboxed?: boolean;
  marketplace?: boolean;
}

export interface GeneratePluginSystemResponse {
  files: PluginSystemFile[];
  summary: string;
  setupInstructions: string;
  examplePlugins: string[];
}

const PLUGIN_SYSTEM_PROMPT = `You are ZIVO AI — an expert in extensible plugin architectures for Next.js applications.

Generate a complete plugin/extension system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "examplePlugins": ["plugin-name — description"]
}

Always include:
- lib/plugins/registry.ts — Plugin registration and lookup
- lib/plugins/sandbox.ts — Sandboxed plugin execution environment
- lib/plugins/loader.ts — Dynamic plugin loader
- lib/plugins/types.ts — Plugin interface definitions and lifecycle hooks
- app/plugins/page.tsx — Plugin marketplace/manager UI
- app/api/plugins/route.ts — Plugin CRUD API
- components/PluginCard.tsx — Plugin display card
- components/PluginManager.tsx — Plugin enable/disable UI

Plugin lifecycle hooks:
- beforeRender — Transform content before render
- afterSave — Post-processing after data save
- onEvent — React to application events

Include example plugins: analytics, chatbot, feedback widget.
Use iframe or Web Worker sandboxing for third-party plugins.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({})) as GeneratePluginSystemRequest;
    const {
      appName = "My App",
      pluginTypes = ["analytics", "chatbot", "feedback"],
      sandboxed = true,
      marketplace = true,
    } = body;

    const userPrompt = `Generate a complete plugin/extension system for "${appName}".
Plugin types to support: ${pluginTypes.join(", ")}
Sandboxed execution: ${sandboxed}
Plugin marketplace UI: ${marketplace}

Generate:
1. Plugin registry (lib/plugins/registry.ts)
2. Sandboxed execution environment (lib/plugins/sandbox.ts)
3. Dynamic plugin loader (lib/plugins/loader.ts)
4. TypeScript interfaces and lifecycle hooks (lib/plugins/types.ts)
5. Plugin marketplace UI page (app/plugins/page.tsx)
6. Plugin CRUD API (app/api/plugins/route.ts)
7. Plugin display component (components/PluginCard.tsx)
8. Plugin manager component (components/PluginManager.tsx)
9. Example plugins: ${pluginTypes.join(", ")} (lib/plugins/examples/)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: PLUGIN_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GeneratePluginSystemResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
