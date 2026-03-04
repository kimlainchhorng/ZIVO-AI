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
