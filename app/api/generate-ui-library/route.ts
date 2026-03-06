import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface UILibraryFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateUILibraryRequest {
  appName?: string;
  categories?: Array<
    | "layout"
    | "data-display"
    | "forms"
    | "feedback"
    | "navigation"
    | "charts"
    | "all"
  >;
  darkMode?: boolean;
  storybook?: boolean;
  accessibility?: boolean;
}

export interface GenerateUILibraryResponse {
  files: UILibraryFile[];
  summary: string;
  setupInstructions: string;
  componentList: string[];
}

const UI_LIBRARY_SYSTEM_PROMPT = `You are ZIVO AI — an expert in React component libraries, design systems, and UI development.

Generate a complete internal UI component library for a Next.js App Router project using Tailwind CSS and Radix UI.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "componentList": ["ComponentName — description"]
}

Always include the following components:
Layout: AppShell, Sidebar, TopNav, PageHeader, ContentArea
Data Display: DataTable (sortable/filterable/paginated), StatsCard, KPIWidget, Timeline, ActivityFeed, Avatar, AvatarGroup
Forms: MultiSelect, DateRangePicker, ColorPicker, FileUpload, RichTextEditor, JSONEditor, CodeEditor
Feedback: Toast, Alert, ConfirmDialog, LoadingOverlay, ProgressBar, Skeleton
Navigation: Breadcrumbs, Tabs, Stepper, Pagination, CommandPalette
Charts: LineChart, BarChart, PieChart, AreaChart, HeatMap

Also include:
- components/ui/index.ts — Barrel export for all components
- lib/utils.ts — cn() utility and shared helpers
- .storybook/main.ts — Storybook configuration
- .storybook/preview.ts — Storybook global decorators

Every component must:
- Support dark mode via Tailwind CSS dark: prefix
- Include TypeScript props interface
- Be ARIA-accessible
- Include JSDoc comment

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateUILibraryRequest;
    try {
      body = await req.json() as GenerateUILibraryRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      categories = ["all"],
      darkMode = true,
      storybook = true,
      accessibility = true,
    } = body;

    const selectedCategories = categories.includes("all")
      ? ["layout", "data-display", "forms", "feedback", "navigation", "charts"]
      : categories;

    const userPrompt = `Generate a complete UI component library for "${appName}".
Component categories: ${selectedCategories.join(", ")}
Dark mode support: ${darkMode}
Storybook integration: ${storybook}
Accessibility (ARIA): ${accessibility}

Generate 50+ components across all categories. Include:
1. All Layout components (AppShell, Sidebar, TopNav, PageHeader, ContentArea)
2. All Data Display components (DataTable with sorting/filtering/pagination, StatsCard, KPIWidget, Timeline, ActivityFeed, Avatar, AvatarGroup)
3. All Form components (MultiSelect, DateRangePicker, ColorPicker, FileUpload, RichTextEditor using Tiptap, JSONEditor, CodeEditor using Monaco)
4. All Feedback components (Toast, Alert, ConfirmDialog, LoadingOverlay, ProgressBar, Skeleton)
5. All Navigation components (Breadcrumbs, Tabs, Stepper, Pagination, CommandPalette with ⌘K)
6. All Chart components (LineChart, BarChart, PieChart, AreaChart, HeatMap using Recharts)
7. Barrel export file (components/ui/index.ts)
8. Storybook configuration (.storybook/)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: UI_LIBRARY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateUILibraryResponse;
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
