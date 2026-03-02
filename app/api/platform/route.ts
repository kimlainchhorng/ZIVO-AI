import { NextResponse } from "next/server";
import { PLATFORMS, getPlatformById } from "../../../lib/platforms";
import { getIntegrationsByCategory, INTEGRATIONS } from "../../../lib/integrations";
import PlatformAgent from "../../../agents/platform-agent";

export const runtime = "nodejs";

const agent = new PlatformAgent();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platformId = searchParams.get("id");
  const category = searchParams.get("category");

  if (platformId) {
    const platform = getPlatformById(platformId);
    if (!platform) {
      return NextResponse.json({ error: "Platform not found" }, { status: 404 });
    }
    const integrations = getIntegrationsByCategory(platform.integrationCategory);
    return NextResponse.json({ platform, integrations });
  }

  if (category) {
    const integrations = getIntegrationsByCategory(category);
    return NextResponse.json({ integrations });
  }

  return NextResponse.json({
    platforms: PLATFORMS,
    totalIntegrations: INTEGRATIONS.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, platformId, enabledFeatures, enabledIntegrations } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    if (action === "config") {
      if (!platformId || typeof platformId !== "string") {
        return NextResponse.json({ error: "Missing platformId" }, { status: 400 });
      }
      const config = agent.buildConfig(platformId, enabledFeatures, enabledIntegrations);
      return NextResponse.json({ config });
    }

    if (action === "prompt") {
      if (!platformId || typeof platformId !== "string") {
        return NextResponse.json({ error: "Missing platformId" }, { status: 400 });
      }
      const prompt = agent.generatePrompt(platformId);
      return NextResponse.json({ prompt });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
