import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET() {
  return NextResponse.json({ description: "Architecture generator API" });
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is missing' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { prompt } = body as { prompt?: string };

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const systemPrompt = `You are a software architecture expert. Generate a JSON architecture diagram for the given app description.
Return ONLY valid JSON with this structure:
{
  "components": [{ "name": string, "type": string, "description": string, "connections": string[] }],
  "layers": [{ "name": string, "components": string[] }],
  "summary": string
}`;

  try {
    const client = getClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const rawText = response.choices?.[0]?.message?.content ?? '';
    const architecture = parseArchitecture(rawText);
    return NextResponse.json({ architecture });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message ?? 'Failed to generate architecture' }, { status: 500 });
  }
}

function parseArchitecture(text: string): unknown {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    const match = extractArchitectureFromText(text);
    return match ? JSON.parse(match) : { error: 'Failed to parse architecture' };
  }
}

function extractArchitectureFromText(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}