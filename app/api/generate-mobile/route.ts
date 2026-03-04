import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export type MobilePlatform = "flutter" | "react-native" | "kotlin" | "swift";

export interface MobileFile {
  path: string;
  content: string;
}

export interface GenerateMobileResponse {
  platform: MobilePlatform;
  files: MobileFile[];
  summary: string;
  setup_instructions: string;
}

const PLATFORM_PROMPTS: Record<MobilePlatform, string> = {
  flutter: `Generate a Flutter/Dart mobile app scaffold. Include:
- lib/main.dart (entry point with MaterialApp)
- lib/screens/home_screen.dart (main screen with Scaffold)
- lib/widgets/ (at least one reusable widget)
- pubspec.yaml (with flutter_lints and cupertino_icons)
- README.md
Use Flutter 3.x patterns, Material 3 design, and proper Dart null safety.`,

  "react-native": `Generate a React Native mobile app scaffold. Include:
- App.tsx (entry point with NavigationContainer)
- src/screens/HomeScreen.tsx (main screen)
- src/components/ (at least one reusable component)
- package.json (with react-navigation, react-native-vector-icons)
- tsconfig.json
- README.md
Use React Native 0.73+, TypeScript, and React Navigation v6.`,

  kotlin: `Generate an Android (Kotlin) mobile app scaffold. Include:
- app/src/main/java/.../MainActivity.kt (with Jetpack Compose)
- app/src/main/java/.../ui/HomeScreen.kt (Composable screen)
- app/src/main/res/values/strings.xml
- app/build.gradle.kts (with Compose dependencies)
- build.gradle.kts (root)
- README.md
Use Kotlin, Jetpack Compose, Material 3, and MVVM architecture.`,

  swift: `Generate an iOS (Swift) mobile app scaffold. Include:
- App/ContentView.swift (main SwiftUI view)
- App/Views/HomeView.swift (home screen)
- App/Models/ (at least one data model)
- App.swift (entry point with @main)
- README.md
Use Swift 5.9+, SwiftUI, and MVVM architecture.`,
};

const SYSTEM_PROMPT = `You are ZIVO AI — an expert mobile app developer. Generate complete, working mobile app scaffolds.

You are proficient in: Flutter/Dart, React Native (TypeScript), Kotlin (Jetpack Compose), Swift (SwiftUI).

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "platform": "flutter|react-native|kotlin|swift",
  "files": [
    { "path": "relative/path/file.dart", "content": "..." }
  ],
  "summary": "Brief description of what was scaffolded",
  "setup_instructions": "Step-by-step instructions to run the app"
}`;

function stripCodeFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function parseJSON(text: string): GenerateMobileResponse {
  const clean = stripCodeFences(text);
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const platform = body?.platform as MobilePlatform;
    const description: string = body?.description || "";

    const validPlatforms: MobilePlatform[] = ["flutter", "react-native", "kotlin", "swift"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` },
        { status: 400 }
      );
    }

    if (!description.trim()) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }

    const platformInstructions = PLATFORM_PROMPTS[platform];
    const userPrompt = `Platform: ${platform}\n\n${platformInstructions}\n\nApp description: ${description.trim()}`;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await getClient().chat.completions.create({
          model: "gpt-4o",
          temperature: 0.3,
          max_tokens: 6000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        });

        const text = response.choices?.[0]?.message?.content ?? "{}";
        const parsed = parseJSON(text);

        if (!Array.isArray(parsed.files) || parsed.files.length === 0) {
          throw new Error("Invalid response: missing files array");
        }

        parsed.platform = platform;
        return NextResponse.json(parsed);
      } catch (err) {
        lastError = err as Error;
        if (attempt < 2) continue;
      }
    }

    return NextResponse.json(
      { error: lastError?.message || "Failed to generate mobile scaffold" },
      { status: 502 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
