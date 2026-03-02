import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface BuildLog {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "running";
  duration: number;
  logs: string[];
  projectId?: string;
}

const buildHistory: BuildLog[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { htmlContent, projectId } = body;

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json({ error: "htmlContent is required" }, { status: 400 });
    }

    const buildId = `build-${Date.now()}`;
    const startTime = Date.now();
    const logs: string[] = [];

    logs.push(`[${new Date().toISOString()}] Starting build ${buildId}`);
    logs.push(`[${new Date().toISOString()}] Validating HTML structure...`);

    // Basic HTML validation
    const hasDoctype = /<!DOCTYPE html>/i.test(htmlContent);
    const hasHtml = /<html/i.test(htmlContent);
    const hasHead = /<head/i.test(htmlContent);
    const hasBody = /<body/i.test(htmlContent);

    if (!hasDoctype) logs.push(`[WARN] Missing DOCTYPE declaration`);
    if (!hasHtml) logs.push(`[WARN] Missing <html> tag`);
    if (!hasHead) logs.push(`[WARN] Missing <head> section`);
    if (!hasBody) logs.push(`[WARN] Missing <body> section`);

    logs.push(`[${new Date().toISOString()}] Saving build artifact...`);

    // Save to public/versions
    const versionsDir = path.join(process.cwd(), "public", "versions");
    await fs.mkdir(versionsDir, { recursive: true });
    const fileName = `${buildId}.html`;
    await fs.writeFile(path.join(versionsDir, fileName), htmlContent, "utf8");

    const duration = Date.now() - startTime;
    logs.push(`[${new Date().toISOString()}] Build completed in ${duration}ms`);

    const buildLog: BuildLog = {
      id: buildId,
      timestamp: new Date().toISOString(),
      status: "success",
      duration,
      logs,
      projectId,
    };

    buildHistory.unshift(buildLog);
    if (buildHistory.length > 50) buildHistory.pop();

    return NextResponse.json({
      ok: true,
      buildId,
      status: "success",
      duration,
      previewUrl: `/versions/${fileName}`,
      logs,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Build failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, builds: buildHistory });
}
