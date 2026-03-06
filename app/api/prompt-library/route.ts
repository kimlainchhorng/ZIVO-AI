export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  uses: number;
  createdAt: string;
}

const mockPrompts: Prompt[] = [
  {
    id: "pmt_001",
    title: "Code Review Assistant",
    content:
      "You are an expert code reviewer. Analyze the following code for bugs, performance issues, and style violations. Provide actionable feedback with examples.",
    category: "development",
    uses: 342,
    createdAt: "2025-11-01T09:00:00Z",
  },
  {
    id: "pmt_002",
    title: "Research Summarizer",
    content:
      "Summarize the following research content into key findings, methodology, and conclusions. Use bullet points and keep it under 300 words.",
    category: "research",
    uses: 218,
    createdAt: "2025-11-15T14:30:00Z",
  },
  {
    id: "pmt_003",
    title: "SQL Query Builder",
    content:
      "Generate an optimized SQL query for the following requirement. Include indexes and explain the execution plan.",
    category: "database",
    uses: 175,
    createdAt: "2025-12-01T10:00:00Z",
  },
  {
    id: "pmt_004",
    title: "API Documentation Writer",
    content:
      "Write comprehensive API documentation for the following endpoint. Include parameters, response schemas, error codes, and usage examples.",
    category: "documentation",
    uses: 129,
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "pmt_005",
    title: "Bug Root Cause Analyst",
    content:
      "Analyze the following error log and stack trace. Identify the root cause, affected components, and provide a step-by-step fix.",
    category: "debugging",
    uses: 97,
    createdAt: "2026-02-20T16:00:00Z",
  },
];

export async function GET() {
  try {
    return NextResponse.json({ prompts: mockPrompts });
  } catch {
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category } = body as {
      title?: string;
      content?: string;
      category?: string;
    };

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, category" },
        { status: 400 }
      );
    }

    const newPrompt: Prompt = {
      id: `pmt_${randomUUID().slice(0, 8)}`,
      title,
      content,
      category,
      uses: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ prompt: newPrompt, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch {
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
