// lib/ai/mobile-plan.ts — MobilePlan schema + AI-driven plan generator

import { z } from "zod";
import OpenAI from "openai";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const NavigationTypeSchema = z.enum(["tabs", "stack"]);
export type NavigationType = z.infer<typeof NavigationTypeSchema>;

export const ScreenStateSchema = z.enum(["loading", "empty", "error", "success"]);
export type ScreenState = z.infer<typeof ScreenStateSchema>;

export const ScreenSpecSchema = z.object({
  name: z.string(),
  route: z.string(),
  purpose: z.string(),
  states: z.array(ScreenStateSchema),
  components: z.array(z.string()),
});
export type ScreenSpec = z.infer<typeof ScreenSpecSchema>;

export const DataEntitySchema = z.object({
  name: z.string(),
  fields: z.array(z.string()),
});
export type DataEntity = z.infer<typeof DataEntitySchema>;

export const MobilePlanSchema = z.object({
  appName: z.string(),
  persona: z.string(),
  navigation: NavigationTypeSchema,
  screens: z.array(ScreenSpecSchema),
  dataModel: z.array(DataEntitySchema),
});
export type MobilePlan = z.infer<typeof MobilePlanSchema>;

// ─── AI Generator ─────────────────────────────────────────────────────────────

const MOBILE_PLAN_SYSTEM_PROMPT = `You are a mobile app architect. Given a user prompt, generate a structured Expo/React Native app plan.

Return ONLY valid JSON matching this schema exactly:
{
  "appName": "string",
  "persona": "string (who uses this app)",
  "navigation": "tabs" | "stack",
  "screens": [
    {
      "name": "string",
      "route": "string (e.g. (tabs)/home)",
      "purpose": "string",
      "states": ["loading", "empty", "error", "success"],
      "components": ["ComponentName1", "ComponentName2"]
    }
  ],
  "dataModel": [
    {
      "name": "string (entity name)",
      "fields": ["field1", "field2"]
    }
  ]
}

Generate 4-6 screens. Always include a home screen and a settings/profile screen. Use Expo Router conventions (tabs folder for tab navigation).`;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY environment variable is not set");
  return new OpenAI({ apiKey });
}

export async function generateMobilePlan(
  prompt: string,
  model = "gpt-4o"
): Promise<MobilePlan> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4096,
    messages: [
      { role: "system", content: MOBILE_PLAN_SYSTEM_PROMPT },
      { role: "user", content: `Mobile app prompt: ${prompt}` },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  try {
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as unknown;
    return MobilePlanSchema.parse(parsed);
  } catch {
    // Return a safe default plan if parsing fails
    return MobilePlanSchema.parse({
      appName: "MyApp",
      persona: "General user",
      navigation: "tabs",
      screens: [
        {
          name: "Home",
          route: "(tabs)/index",
          purpose: "Main dashboard showing key content",
          states: ["loading", "empty", "error", "success"],
          components: ["Header", "ContentList", "ActionButton"],
        },
        {
          name: "Explore",
          route: "(tabs)/explore",
          purpose: "Browse and discover content",
          states: ["loading", "empty", "error", "success"],
          components: ["SearchBar", "FilterTabs", "ItemGrid"],
        },
        {
          name: "Profile",
          route: "(tabs)/profile",
          purpose: "User profile and settings",
          states: ["loading", "success"],
          components: ["Avatar", "UserInfo", "SettingsList"],
        },
      ],
      dataModel: [
        { name: "User", fields: ["id", "name", "email", "avatar"] },
        { name: "Item", fields: ["id", "title", "description", "imageUrl", "createdAt"] },
      ],
    });
  }
}
