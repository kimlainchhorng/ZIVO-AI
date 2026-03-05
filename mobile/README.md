# ZIVO-AI Generated Mobile App

This is a generated **Expo Router** project with a full tab-based navigation structure.

## Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Expo CLI](https://expo.dev/tools#cli): `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator, or the [Expo Go](https://expo.dev/go) app

## Getting Started

```bash
# Install dependencies
cd mobile
npm install

# Start the development server
npx expo start
```

Scan the QR code with Expo Go on your device, or press:
- `i` to open in iOS Simulator
- `a` to open in Android Emulator
- `w` to open in the browser (web preview)

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout (Stack navigator)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar configuration
│       ├── index.tsx        # Home / Dashboard screen
│       ├── explore.tsx      # Explore / Search screen
│       ├── notifications.tsx # Notifications screen
│       └── profile.tsx      # Profile screen
├── components/
│   └── ui/
│       ├── Button.tsx       # Button primitive
│       ├── Card.tsx         # Card container
│       ├── Badge.tsx        # Status badge
│       └── Input.tsx        # Text input
├── theme/
│   └── tokens.ts            # Design tokens (colors, spacing, typography)
└── lib/
    └── mock-data.ts         # Realistic mock data
```

## Design System

All screens use the shared tokens from `theme/tokens.ts`. Update that file to retheme the entire app.

## Icons

Icons are provided by **lucide-react-native**. Import them directly:

```tsx
import { Home, Search, Bell } from "lucide-react-native";
```

## Adding a New Screen

1. Create a new file under `app/(tabs)/` or `app/`.
2. Add the tab to `app/(tabs)/_layout.tsx` if it should be a tab.
3. Use the UI primitives from `components/ui/` and tokens from `theme/tokens.ts`.
