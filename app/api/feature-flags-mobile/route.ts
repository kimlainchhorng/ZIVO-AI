import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface FeatureFlag {
  name: string;
  enabled: boolean;
}

export async function GET() {
  return NextResponse.json({
    description:
      "Mobile feature flags API. Accepts { flags: Array<{ name: string, enabled: boolean }>, platform: string } and returns a Remote Config-compatible feature flag configuration.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      flags?: FeatureFlag[];
      platform?: string;
    };

    const { flags, platform } = body;

    if (!flags || !Array.isArray(flags) || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: flags (array) and platform" },
        { status: 400 }
      );
    }

    const remoteConfig: Record<string, { defaultValue: { value: string }; description: string }> =
      {};

    for (const flag of flags) {
      if (typeof flag.name !== "string" || typeof flag.enabled !== "boolean") {
        return NextResponse.json(
          { error: "Each flag must have a string name and boolean enabled field" },
          { status: 400 }
        );
      }
      remoteConfig[flag.name] = {
        defaultValue: { value: flag.enabled ? "true" : "false" },
        description: `Feature flag '${flag.name}' for platform '${platform}'`,
      };
    }

    return NextResponse.json({
      platform,
      remoteConfig,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
