import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export type MobilePlatform = "flutter" | "react-native" | "kotlin" | "swift";

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateMobileResponse {
  files: GeneratedFile[];
  commands?: string[];
  summary: string;
  platform: MobilePlatform;
}

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function parseJSON(text: string): GenerateMobileResponse {
  const cleaned = stripMarkdownFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("[generate-mobile] Initial JSON parse failed:", parseErr);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

const PLATFORM_PROMPTS: Record<MobilePlatform, string> = {
  flutter: `You are an expert Flutter/Dart developer. Generate a complete Flutter app scaffold with:
- lib/main.dart (app entry point with MaterialApp)
- lib/screens/ (at least 2 screens)
- lib/widgets/ (reusable widgets)
- lib/services/ (API/data services)
- pubspec.yaml (with dependencies)
- README.md

Use Material 3, proper state management with Provider or Riverpod, and responsive layouts.`,

  "react-native": `You are an expert React Native developer. Generate a complete React Native app scaffold with:
- App.tsx (entry point with navigation)
- src/screens/ (at least 2 screens)
- src/components/ (reusable components)
- src/services/ (API/data services)
- src/navigation/ (React Navigation setup)
- package.json (with all dependencies)
- README.md

Use TypeScript, React Navigation, and responsive StyleSheet layouts.`,

  kotlin: `You are an expert Android/Kotlin developer. Generate a complete Android app scaffold with:
- app/src/main/java/.../MainActivity.kt
- app/src/main/java/.../ui/ (Composable screens)
- app/src/main/java/.../viewmodel/ (ViewModels)
- app/src/main/java/.../data/ (Repository and models)
- app/src/main/res/layout/ or Compose UI
- build.gradle.kts (with dependencies)
- README.md

Use Jetpack Compose, MVVM architecture, and Kotlin Coroutines.`,

  swift: `You are an expert iOS/Swift developer. Generate a complete iOS app scaffold with:
- Sources/App/ContentView.swift (main SwiftUI view)
- Sources/App/Views/ (SwiftUI views)
- Sources/App/ViewModels/ (ObservableObject view models)
- Sources/App/Models/ (data models)
- Sources/App/Services/ (networking/data services)
- Package.swift or project structure info
- README.md

Use SwiftUI, MVVM architecture, and Swift Concurrency (async/await).`,
};

const BASE_INSTRUCTIONS = `
Return ONLY a valid JSON object with this structure:
{
  "files": [
    { "path": "relative/path/to/file", "content": "complete file content", "action": "create" }
  ],
  "commands": ["flutter pub get", "flutter run"],
  "summary": "Brief description of what was generated",
  "platform": "<platform>"
}

Rules:
- Return ONLY the JSON object, no markdown fences, no extra text.
- Generate complete, working code (not stubs).
- Include all necessary configuration files.
- Add clear comments in the code.
- The "platform" field must match the requested platform exactly.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const description: string = body?.description || "";
    const platform: MobilePlatform = ["flutter", "react-native", "kotlin", "swift"].includes(
      body?.platform
    )
      ? (body.platform as MobilePlatform)
      : "flutter";

    if (!description.trim()) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const systemPrompt = `${PLATFORM_PROMPTS[platform]}\n${BASE_INSTRUCTIONS}`;

    let parsed: GenerateMobileResponse | null = null;
    let lastError = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await getClient().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description.trim() },
        ],
        temperature: 0.3,
        max_tokens: 8000,
      });

      const text: string = r.choices[0]?.message?.content ?? "";
      try {
        parsed = parseJSON(text);
        if (Array.isArray(parsed.files)) break;
        lastError = "Invalid response structure: missing files array";
        parsed = null;
      } catch (e) {
        lastError = (e as Error).message || "AI did not return valid JSON";
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: lastError || "AI did not return valid JSON" },
        { status: 502 }
      );
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    parsed.platform = platform;

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
