import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GenerateComponentsRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ComponentFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateComponentsRequest {
  component:
    | "dashboard"
    | "data-table"
    | "form-builder"
    | "file-upload"
    | "rich-text-editor"
    | "date-picker"
    | "command-palette"
    | "toast"
    | "infinite-scroll"
    | "all";
  description?: string;
}

export interface GenerateComponentsResponse {
  files: ComponentFile[];
  summary: string;
  dependencies: string[];
}

const COMPONENTS_SYSTEM_PROMPT = `You are ZIVO AI — an expert React/Next.js UI developer.

Generate production-ready, accessible UI components for a Next.js App Router project using TypeScript and Tailwind CSS.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "dependencies": ["package-name@version"]
}

Component guidelines:
- Dashboard: Use Recharts for charts, responsive grid layout, KPI cards
- Data Table: TanStack Table with sorting, filtering, pagination, row selection
- Form Builder: React Hook Form + Zod validation, accessible labels and errors
- File Upload: Drag-and-drop zone, preview thumbnails, progress bar
- Rich Text Editor: TipTap with toolbar (bold, italic, lists, links, images)
- Date Picker: react-day-picker, accessible, keyboard navigable
- Command Palette: cmdk, keyboard shortcut (Cmd+K), fuzzy search
- Toast: Sonner, success/error/info/warning variants
- Infinite Scroll: Intersection Observer hook, skeleton loading

Use TypeScript strict mode, proper accessibility (ARIA), and Tailwind CSS.
Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const schemaResult = GenerateComponentsRequestSchema.safeParse(body);
    if (!schemaResult.success) {
      return NextResponse.json({ error: schemaResult.error.issues }, { status: 400 });
    }

    const {
      component,
      description,
    } = schemaResult.data;

    const userPrompt = `Generate a production-ready "${component}" UI component${description ? ` for: "${description}"` : ""}.

${component === "all" ? `Generate ALL of these components:
- Dashboard with charts (components/ui/Dashboard.tsx)
- Data Table (components/ui/DataTable.tsx)
- Form Builder (components/ui/FormBuilder.tsx)
- File Upload (components/ui/FileUpload.tsx)
- Rich Text Editor (components/ui/RichTextEditor.tsx)
- Date Picker (components/ui/DatePicker.tsx)
- Command Palette (components/ui/CommandPalette.tsx)
- Toast wrapper (components/ui/Toast.tsx)
- Infinite Scroll (components/ui/InfiniteScroll.tsx)` : `Generate the ${component} component with full TypeScript types, Tailwind CSS styling, and proper accessibility.`}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: COMPONENTS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateComponentsResponse;
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
