import { getOpenAIClient } from "@/lib/openai-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";


const SYSTEM_PROMPT = `You are an expert backend developer specializing in Next.js API routes and Supabase. Generate production-ready backend API routes.

Return a JSON object with this structure:
{
  "description": "string",
  "files": {
    "api/routes/[resource]/route.ts": "...",
    "api/routes/[resource]/[id]/route.ts": "...",
    "src/lib/api-helpers.ts": "...",
    "src/lib/validation.ts": "...",
    "src/middleware.ts": "..."
  },
  "endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "string",
      "description": "string",
      "requestBody": {},
      "responseBody": {}
    }
  ]
}

Always include:
- Full CRUD endpoints (GET list, GET by id, POST, PUT, DELETE)
- Input validation and sanitization (prevent SQL injection and XSS)
- Error handling with proper HTTP status codes
- Rate limiting headers
- CORS configuration
- Authentication middleware using Supabase JWT
- Row Level Security enforcement
- Pagination for list endpoints
- Logging
- TypeScript types throughout`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, resource } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const userMessage = [
      `Generate backend API routes for: ${prompt}`,
      resource ? `Resource name: ${resource}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const r = await getOpenAIClient().responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const text = (r as any).output_text ?? "";

    let parsed: any = null;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
    } catch {
      parsed = { raw: text };
    }

    return NextResponse.json({ ok: true, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "API generation failed" }, { status: 500 });
  }
}
