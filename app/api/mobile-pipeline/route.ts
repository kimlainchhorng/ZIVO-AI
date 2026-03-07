import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

interface MobilePipelineRequest {
  platform: "iOS" | "Android" | "Both";
  appName: string;
  features?: string[];
  ciProvider?: "github-actions" | "bitrise" | "fastlane" | "circleci";
  environment?: "staging" | "production" | "both";
  runTests?: boolean;
  distributionMethod?: "testflight" | "firebase-app-distribution" | "diawi" | "app-store" | "play-store";
}

export async function GET() {
  return NextResponse.json({
    description:
      "Mobile CI/CD pipeline generator. Accepts { platform: 'iOS'|'Android'|'Both', appName: string, features?: string[], ciProvider?: 'github-actions'|'bitrise'|'fastlane'|'circleci', environment?: 'staging'|'production'|'both', runTests?: boolean, distributionMethod?: 'testflight'|'firebase-app-distribution'|'diawi'|'app-store'|'play-store' } and returns a generated mobile pipeline configuration.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as MobilePipelineRequest;

    const {
      platform,
      appName,
      features,
      ciProvider = "github-actions",
      environment = "production",
      runTests = true,
      distributionMethod,
    } = body;

    if (!platform || !appName) {
      return NextResponse.json(
        { error: "Missing required fields: platform and appName" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a mobile DevOps expert. Generate a complete CI/CD pipeline configuration for the specified mobile platform(s).

Follow these rules:
- Target the specified CI provider (${ciProvider}). Generate the correct YAML/config format for that provider.
- When environment is "both", generate separate jobs or workflows for staging and production.
- When runTests is true, include unit test and UI test stages (XCTest / Espresso as appropriate).
- Configure the distribution method correctly: TestFlight, Firebase App Distribution, Diawi, App Store Connect, or Google Play Store.
- Add dependency caching: CocoaPods/SPM cache for iOS, Gradle cache for Android.
- Add a Slack/email notification step on pipeline success AND failure.
- Include code signing setup: match (Fastlane) for iOS, keystore for Android.
- Return only the pipeline configuration file(s) with brief inline comments.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            platform,
            appName,
            features: features ?? [],
            ciProvider,
            environment,
            runTests,
            distributionMethod: distributionMethod ?? (
            platform === "Android" ? "play-store" :
            platform === "Both" ? "app-store" :
            "app-store"
          ),
          }),
        },
      ],
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
