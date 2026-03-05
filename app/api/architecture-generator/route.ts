import { NextResponse } from 'next/server';
import { OpenAI } from 'some-openai-lib';

const architect = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is missing' }, { status: 400 });
  }

  const jsonPrompt = `...`; // Your strict JSON schema prompt

  try {
    const response = await architect.completions.create({ prompt: jsonPrompt });
    const architecture = parseArchitecture(response.text);
    return NextResponse.json({ architecture });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate architecture' }, { status: 500 });
  }
}

function parseArchitecture(text: string) {
  try {
    // Implement robust parsing logic here, including regex fallback
    return JSON.parse(text);
  } catch (regexError) {
    // Fallback regex logic
    const match = extractArchitectureFromText(text);
    return match ? JSON.parse(match) : { error: 'Failed to parse architecture' };
  }
}

function extractArchitectureFromText(text: string): string | null {
  const regex = /some-regex-pattern/;
  const match = text.match(regex);
  return match ? match[0] : null;
}