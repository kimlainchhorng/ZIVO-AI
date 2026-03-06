import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface FormBuilderFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateFormBuilderRequest {
  appName?: string;
  fieldTypes?: Array<
    | "text"
    | "email"
    | "phone"
    | "date"
    | "file"
    | "signature"
    | "payment"
    | "rating"
    | "select"
    | "checkbox"
    | "radio"
    | "all"
  >;
  multiStep?: boolean;
  conditionalLogic?: boolean;
  webhooks?: boolean;
  gdprCompliant?: boolean;
}

export interface GenerateFormBuilderResponse {
  files: FormBuilderFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const FORM_BUILDER_SYSTEM_PROMPT = `You are ZIVO AI — an expert in building visual form editors and survey tools for Next.js.

Generate a complete visual drag-and-drop form builder for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include:
- components/FormBuilder/index.tsx — Main form builder component
- components/FormBuilder/FieldPalette.tsx — Draggable field palette sidebar
- components/FormBuilder/FormCanvas.tsx — Drop zone for form layout editing
- components/FormBuilder/FieldSettings.tsx — Field configuration panel
- components/FormBuilder/FormPreview.tsx — Live preview of the form
- components/FormBuilder/SubmissionsTable.tsx — View and export submissions
- app/forms/page.tsx — Form builder page
- app/forms/[formId]/page.tsx — Published form view
- app/api/forms/route.ts — Form CRUD API
- app/api/forms/[formId]/submissions/route.ts — Form submissions API
- lib/forms/validation.ts — Zod schema generation from form definition

Support 20+ field types, conditional logic (show field if X = Y), multi-step forms.
Use @dnd-kit for drag-and-drop. Validate with Zod. Export submissions as CSV.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateFormBuilderRequest;
    try {
      body = await req.json() as GenerateFormBuilderRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      fieldTypes = ["all"],
      multiStep = true,
      conditionalLogic = true,
      webhooks = true,
      gdprCompliant = true,
    } = body;

    const selectedFields = fieldTypes.includes("all")
      ? ["text", "email", "phone", "date", "file", "signature", "payment", "rating", "select", "checkbox", "radio", "textarea", "url", "number", "color", "range"]
      : fieldTypes;

    const userPrompt = `Generate a visual drag-and-drop form builder for "${appName}".
Field types: ${selectedFields.join(", ")}
Multi-step forms: ${multiStep}
Conditional logic: ${conditionalLogic}
Webhook on submission: ${webhooks}
GDPR compliant: ${gdprCompliant}

Generate:
1. Main form builder component (components/FormBuilder/index.tsx)
2. Draggable field palette (components/FormBuilder/FieldPalette.tsx)
3. Form canvas/layout editor (components/FormBuilder/FormCanvas.tsx)
4. Field settings panel (components/FormBuilder/FieldSettings.tsx)
5. Live form preview (components/FormBuilder/FormPreview.tsx)
6. Submissions viewer with CSV export (components/FormBuilder/SubmissionsTable.tsx)
7. Form builder page (app/forms/page.tsx)
8. Published form view (app/forms/[formId]/page.tsx)
9. Form CRUD API (app/api/forms/route.ts)
10. Submissions API with CSV export (app/api/forms/[formId]/submissions/route.ts)
11. Zod validation generator (lib/forms/validation.ts)
${webhooks ? "12. Webhook handler (app/api/forms/[formId]/webhook/route.ts)" : ""}`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: FORM_BUILDER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateFormBuilderResponse;
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
