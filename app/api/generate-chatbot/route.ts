import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface ChatbotFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateChatbotRequest {
  botName?: string;
  personality?: string;
  knowledgeBaseDescription?: string;
  primaryColor?: string;
}

export interface GenerateChatbotResponse {
  files: ChatbotFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const CHATBOT_SYSTEM_PROMPT = `You are ZIVO AI — an expert in RAG chatbot systems.

Generate a complete RAG (Retrieval-Augmented Generation) chatbot system for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup",
  "requiredEnvVars": ["OPENAI_API_KEY", "NEXT_PUBLIC_SUPABASE_URL"]
}

Always include:
- app/api/chatbot/route.ts — RAG chat endpoint
- app/api/chatbot/ingest/route.ts — Knowledge ingestion endpoint
- components/ChatWidget.tsx — Embeddable chat widget
- lib/rag/chunker.ts — Text chunking utilities
- lib/rag/embedder.ts — OpenAI embedding utilities
- lib/rag/retriever.ts — Vector similarity search

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    const body = await req.json() as GenerateChatbotRequest;
    const {
      botName = "Assistant",
      personality = "helpful and professional",
      knowledgeBaseDescription = "product documentation",
      primaryColor = "#4f46e5",
    } = body;

    const userPrompt = `Generate a RAG chatbot named "${botName}".
Personality: ${personality}
Knowledge base: ${knowledgeBaseDescription}
Primary color: ${primaryColor}

Include full RAG pipeline: chunking, embedding, vector search, and streaming chat.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: CHATBOT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateChatbotResponse;
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
