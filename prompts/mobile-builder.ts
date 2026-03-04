export type MobilePlatform = "flutter" | "react-native" | "kotlin" | "swift";

export const MOBILE_PLATFORMS: MobilePlatform[] = ["flutter", "react-native", "kotlin", "swift"];

export const MOBILE_PLATFORM_LABELS: Record<MobilePlatform, string> = {
  flutter: "Flutter (Dart)",
  "react-native": "React Native (TypeScript)",
  kotlin: "Android (Kotlin)",
  swift: "iOS (Swift)",
};

export const MOBILE_BUILDER_SYSTEM_PROMPT = `You are ZIVO AI — an expert mobile app developer. Generate complete, working mobile app scaffolds.

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

export const MOBILE_BUILDER_PROMPTS = {
  flutter: `You are an expert Flutter/Dart developer. Generate a complete Flutter app scaffold with:
- lib/main.dart (app entry point with MaterialApp/CupertinoApp)
- lib/screens/ (at least 2 screens with navigation)
- lib/widgets/ (reusable widgets)
- lib/services/ (API/data services)
- lib/models/ (data models)
- pubspec.yaml (with all dependencies)
- README.md

Use Material 3, proper state management with Provider or Riverpod, and responsive layouts.
Add smooth animations and transitions.`,

  "react-native": `You are an expert React Native developer. Generate a complete React Native app scaffold with:
- App.tsx (entry point with React Navigation)
- src/screens/ (at least 2 screens)
- src/components/ (reusable components)
- src/services/ (API/data services)
- src/navigation/ (React Navigation setup with types)
- src/types/ (TypeScript interfaces)
- package.json (with all dependencies)
- README.md

Use TypeScript, React Navigation v6, Expo SDK if applicable, and responsive StyleSheet layouts.`,

  kotlin: `You are an expert Android/Kotlin developer. Generate a complete Android app scaffold with:
- app/src/main/java/com/app/MainActivity.kt (Compose entry)
- app/src/main/java/com/app/ui/screens/ (Composable screens)
- app/src/main/java/com/app/ui/components/ (reusable Composables)
- app/src/main/java/com/app/viewmodel/ (ViewModels with StateFlow)
- app/src/main/java/com/app/data/ (Repository and data models)
- app/build.gradle.kts (with Compose and all dependencies)
- README.md

Use Jetpack Compose, MVVM architecture, Kotlin Coroutines + Flow, and Hilt for DI.`,

  swift: `You are an expert iOS/Swift developer. Generate a complete iOS app scaffold with:
- Sources/App/App.swift (SwiftUI app entry point)
- Sources/App/Views/ (SwiftUI views with navigation)
- Sources/App/ViewModels/ (ObservableObject view models)
- Sources/App/Models/ (Codable data models)
- Sources/App/Services/ (networking with async/await)
- Package.swift (with dependencies)
- README.md

Use SwiftUI, MVVM architecture, Swift Concurrency (async/await), and Combine for reactive data.`,
} as const;

export const MOBILE_BUILDER_BASE_INSTRUCTIONS = `
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
- Generate complete, working code (not stubs or placeholders).
- Include all necessary configuration files.
- Add clear comments explaining key parts of the code.
- The "platform" field must match the requested platform exactly (flutter, react-native, kotlin, or swift).
- Include realistic sample data or API integration examples.`;

export const MOBILE_PLATFORM_PROMPTS: Record<MobilePlatform, string> = {
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

  "react-native": `Generate a complete React Native mobile app. Include ALL of these files:
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

  kotlin: `Generate a complete Android (Kotlin) mobile app. Include ALL of these files:
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

  swift: `Generate a complete iOS (Swift) mobile app. Include ALL of these files:
- App.swift (entry point with @main App struct)
- ContentView.swift (root content view)
- Views/HomeView.swift (main home screen view)
- Views/LoginView.swift (login screen with form)
- Models/User.swift (User Codable model)
- Services/APIService.swift (URLSession-based HTTP client)
- README.md
Use Swift 5.9+, SwiftUI, Combine, async/await, and MVVM architecture.`,
};
