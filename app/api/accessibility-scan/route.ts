import { NextResponse } from "next/server";
import { scanAccessibility } from "@/lib/ai/accessibility-scanner";

export const runtime = "nodejs";

// POST { files: GeneratedFile[] } -> AccessibilityReport
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    files?: { path: string; content: string }[];
  };
  const report = scanAccessibility(body.files ?? []);
  return NextResponse.json(report);
}
