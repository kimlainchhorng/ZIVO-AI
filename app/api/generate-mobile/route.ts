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
  flutter: `Generate a complete Flutter/Dart mobile app. Include ALL of these files:
- lib/main.dart (app entry point with MaterialApp and routing)
- lib/screens/home_screen.dart (main home screen with Scaffold)
- lib/screens/login_screen.dart (login screen with form validation)
- lib/widgets/custom_button.dart (reusable styled button widget)
- lib/services/api_service.dart (HTTP client using http package)
- lib/models/user.dart (User model with fromJson/toJson)
- pubspec.yaml (with dependencies: http, flutter_lints, shared_preferences)
- README.md
Use Flutter 3.x patterns, Material 3 design, and proper Dart null safety.`,

  "react-native": `Generate a complete React Native full mobile app. Include ALL of these files:
- App.tsx (entry point with NavigationContainer)
- src/screens/HomeScreen.tsx (main home screen)
- src/screens/LoginScreen.tsx (login screen with form)
- src/components/Button.tsx (reusable styled button component)
- src/services/api.ts (HTTP client with typed responses)
- src/navigation/AppNavigator.tsx (React Navigation stack + tab navigator)
- package.json (with react-navigation, axios, react-native-vector-icons)
- tsconfig.json
- README.md
Use React Native 0.73+, TypeScript, React Navigation v6, and proper typing.`,

  kotlin: `Generate a complete Android (Kotlin) full mobile app. Include ALL of these files:
- app/src/main/java/com/app/MainActivity.kt (entry with Jetpack Compose)
- app/src/main/java/com/app/ui/HomeActivity.kt (home screen Composable)
- app/src/main/java/com/app/models/User.kt (User data class)
- app/src/main/java/com/app/services/ApiService.kt (Retrofit HTTP client)
- app/src/main/res/layout/activity_main.xml (main layout XML)
- app/src/main/AndroidManifest.xml (app manifest with permissions)
- app/build.gradle.kts (Compose + Retrofit dependencies)
- build.gradle.kts (root project build file)
- README.md
Use Kotlin, Jetpack Compose, Material 3, Retrofit 2, and MVVM architecture.`,

  swift: `Generate a complete iOS (Swift) full mobile app. Include ALL of these files:
- App.swift (entry point with @main App struct)
- ContentView.swift (root content view)
- Views/HomeView.swift (main home screen view)
- Views/LoginView.swift (login screen with form)
- Models/User.swift (User Codable model)
- Services/APIService.swift (URLSession-based HTTP client)
- README.md
Use Swift 5.9+, SwiftUI, Combine, async/await, and MVVM architecture.`,
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
