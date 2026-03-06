import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAllTemplates, getTemplateById, type ProjectTemplate } from "../../../lib/templates";
import { stripMarkdownFences } from "../../../lib/code-parser";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET() {
  return NextResponse.json({ templates: getAllTemplates() });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { templateId, customization } = body as { templateId: string; customization?: string };

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 });
    }

    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: `Template '${templateId}' not found` }, { status: 404 });
    }

    if (!customization) {
      return NextResponse.json({ template });
    }

    // Generate customized version using GPT-4o
    const baseFiles = template.files.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n");
    const completion = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are a code generator. Given a project template and customization requirements, return a JSON array of files: [{"path":"...","content":"..."}]. Respond ONLY with the JSON array.`,
        },
        {
          role: "user",
          content: `Template: ${template.name}\n\nBase files:\n${baseFiles}\n\nCustomization: ${customization}\n\nReturn the customized files as a JSON array.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    let customFiles: Array<{ path: string; content: string }> = [];
    try {
      customFiles = JSON.parse(stripMarkdownFences(raw)) as typeof customFiles;
    } catch {
      customFiles = template.files;
    }

    const result: ProjectTemplate = {
      ...template,
      files: customFiles.map((f) => ({ path: f.path, content: f.content })),
    };

    return NextResponse.json({ template: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
