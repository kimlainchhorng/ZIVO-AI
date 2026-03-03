import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
You are a file generator AI.
Return ONLY valid JSON.
Format:

{
  "files": [
    {
      "path": "app/page.tsx",
      "content": "file content here"
    }
  ]
}
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = response.choices[0].message.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from AI", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
