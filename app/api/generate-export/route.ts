import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ExportFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateExportRequest {
  appName?: string;
  exportFormats?: Array<"pdf" | "excel" | "csv" | "json" | "markdown" | "all">;
  importSources?: Array<"notion" | "airtable" | "csv" | "json" | "none">;
  pdfRenderer?: "puppeteer" | "react-pdf";
}

export interface GenerateExportResponse {
  files: ExportFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const EXPORT_SYSTEM_PROMPT = `You are ZIVO AI — an expert in data portability, export/import systems for Next.js applications.

Generate a complete data export and import system for a Next.js App Router project.

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
- app/api/export/pdf/route.ts — PDF export using Puppeteer headless
- app/api/export/excel/route.ts — Excel/XLSX export using ExcelJS
- app/api/export/csv/route.ts — CSV export
- app/api/export/json/route.ts — JSON export
- app/api/import/route.ts — Import from CSV/JSON/external sources
- components/ExportButton.tsx — Export menu with format picker dropdown
- lib/export/pdf.ts — PDF generation helpers
- lib/export/excel.ts — Excel generation helpers
- lib/export/csv.ts — CSV generation helpers
- lib/import/parsers.ts — Import file parsers

Use ExcelJS for Excel exports, Puppeteer for PDF generation.
Include streaming responses for large file exports.

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({})) as GenerateExportRequest;
    const {
      appName = "My App",
      exportFormats = ["all"],
      importSources = ["csv", "json"],
      pdfRenderer = "puppeteer",
    } = body;

    const selectedFormats = exportFormats.includes("all")
      ? ["pdf", "excel", "csv", "json", "markdown"]
      : exportFormats;

    const userPrompt = `Generate a complete export and import system for "${appName}".
Export formats: ${selectedFormats.join(", ")}
Import sources: ${importSources.join(", ")}
PDF renderer: ${pdfRenderer}

Generate:
1. PDF export API using ${pdfRenderer} (app/api/export/pdf/route.ts)
2. Excel/XLSX export API using ExcelJS (app/api/export/excel/route.ts)
3. CSV export API (app/api/export/csv/route.ts)
4. JSON export API (app/api/export/json/route.ts)
5. Import API for ${importSources.join(", ")} (app/api/import/route.ts)
6. ExportButton component with format picker (components/ExportButton.tsx)
7. PDF generation helpers (lib/export/pdf.ts)
8. Excel generation helpers (lib/export/excel.ts)
9. CSV generation helpers (lib/export/csv.ts)
10. Import parsers (lib/import/parsers.ts)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: EXPORT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateExportResponse;
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
