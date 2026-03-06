import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface AppStoreFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface PublishAppStoreRequest {
  appName: string;
  bundleId?: string;
  description?: string;
  category?: string;
  platform?: "ios" | "android" | "both";
}

export interface PublishAppStoreResponse {
  files: AppStoreFile[];
  summary: string;
  checklist: string[];
}

const APP_STORE_SYSTEM_PROMPT = `You are ZIVO AI — an expert in mobile app store submissions.

Generate all files needed to submit a mobile app to the Apple App Store and/or Google Play Store.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "checklist": ["Requirement 1", "Requirement 2"]
}

For iOS: include Info.plist, App Store Connect metadata, privacy policy template.
For Android: include AndroidManifest.xml, Play Store listing metadata, build instructions.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as PublishAppStoreRequest;
    const { appName, bundleId, description, category = "Utilities", platform = "both" } = body;

    if (!appName) {
      return NextResponse.json({ error: "Missing appName" }, { status: 400 });
    }

    const userPrompt = `Generate App Store submission files for:
App Name: ${appName}
Bundle ID: ${bundleId ?? `com.example.${appName.toLowerCase().replace(/\s/g, "")}`}
Description: ${description ?? "A great app"}
Category: ${category}
Platform: ${platform}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 4096,
      messages: [
        { role: "system", content: APP_STORE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: PublishAppStoreResponse;
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
