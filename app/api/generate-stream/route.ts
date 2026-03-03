import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "placeholder",
});

const SYSTEM_PROMPT = `You are ZIVO AI — an expert full-stack developer that generates complete, working web applications.

When given a description, respond with a valid JSON object:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>...(complete, self-contained HTML with inline CSS and JS)...",
      "language": "html"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(single self-contained HTML file for live preview)...",
  "summary": "Brief description of what was built"
}

Rules:
- ALWAYS include a \`preview_html\` field: a single complete self-contained HTML file with ALL CSS inline in <style> tags and ALL JS inline in <script> tags. No external CDN links that might fail.
- Make the UI beautiful: use modern CSS, gradients, good typography, proper spacing
- The HTML preview should look like a real polished app, not a demo
- Also include the main Next.js/React files in the \`files\` array
- Return ONLY valid JSON, no markdown fences, no explanation text`;

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const prompt: string = body?.prompt || "";

  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: Number(process.env.OPENAI_TEMPERATURE ?? "0.4"),
    max_tokens: 4000,
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content ?? "";
        if (token) {
          controller.enqueue(encoder.encode(token));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
