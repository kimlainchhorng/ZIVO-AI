import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "OTA updates configuration for React Native/Expo. Accepts { appSlug: string, channel: string, runtime: string } and returns an EAS Update configuration.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      appSlug?: string;
      channel?: string;
      runtime?: string;
    };

    const { appSlug, channel, runtime: runtimeVersion } = body;

    if (!appSlug || !channel || !runtimeVersion) {
      return NextResponse.json(
        { error: "Missing required fields: appSlug, channel, and runtime" },
        { status: 400 }
      );
    }

    const easConfig = {
      cli: { version: ">= 5.0.0" },
      build: {
        development: {
          channel,
          distribution: "internal",
          developmentClient: true,
        },
        preview: {
          channel,
          distribution: "internal",
        },
        production: {
          channel: "production",
          distribution: "store",
        },
      },
      update: {
        url: `https://u.expo.dev/${appSlug}`,
        channel,
        runtimeVersion,
        checkAutomatically: "ON_LOAD",
      },
      submit: {
        production: {},
      },
    };

    const appConfig = {
      expo: {
        slug: appSlug,
        runtimeVersion: { policy: "sdkVersion" },
        updates: {
          url: `https://u.expo.dev/${appSlug}`,
          enabled: true,
          fallbackToCacheTimeout: 0,
          checkAutomatically: "ON_LOAD",
          channel,
        },
        extra: {
          eas: {
            projectId: `<your-project-id-for-${appSlug}>`,
          },
        },
      },
    };

    return NextResponse.json({
      easConfig,
      appConfig,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
