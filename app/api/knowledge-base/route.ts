export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface KBDocument {
  id: string;
  title: string;
  content_preview: string;
  tokens: number;
  status: "indexed" | "pending" | "failed";
  type: string;
  createdAt: string;
}

const mockDocuments: KBDocument[] = [
  {
    id: "doc_001",
    title: "ZIVO AI Architecture Overview",
    content_preview:
      "ZIVO AI is a modular agentic system built on LangChain 1.2 and OpenAI GPT-4o. The platform supports multi-agent orchestration, retrieval-augmented generation (RAG), and real-time streaming responses...",
    tokens: 4820,
    status: "indexed",
    type: "markdown",
    createdAt: "2025-10-15T08:00:00Z",
  },
  {
    id: "doc_002",
    title: "API Reference v2",
    content_preview:
      "Complete reference for the ZIVO REST API. Covers authentication, rate limits, all endpoints, request/response schemas, and SDK usage examples for TypeScript and Python...",
    tokens: 9310,
    status: "indexed",
    type: "pdf",
    createdAt: "2025-11-20T10:30:00Z",
  },
  {
    id: "doc_003",
    title: "Security & Compliance Policy",
    content_preview:
      "This document outlines ZIVO AI's data handling practices, SOC 2 Type II compliance status, encryption standards, and responsible AI usage guidelines...",
    tokens: 3150,
    status: "indexed",
    type: "docx",
    createdAt: "2025-12-05T14:00:00Z",
  },
  {
    id: "doc_004",
    title: "Onboarding Runbook",
    content_preview:
      "Step-by-step guide for setting up a new ZIVO AI workspace. Covers environment setup, API key provisioning, first agent deployment, and connecting external data sources...",
    tokens: 2480,
    status: "pending",
    type: "markdown",
    createdAt: "2026-02-01T09:00:00Z",
  },
];

export async function GET() {
  try {
    return NextResponse.json({ documents: mockDocuments });
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type } = body as {
      title?: string;
      content?: string;
      type?: string;
    };

    if (!title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 }
      );
    }

    const newDocument: KBDocument = {
      id: `doc_${randomUUID().slice(0, 8)}`,
      title,
      content_preview: content.slice(0, 200) + (content.length > 200 ? "..." : ""),
      tokens: Math.ceil(content.split(/\s+/).length * 1.3),
      status: "indexed",
      type: type ?? "text",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ document: newDocument, indexed: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to index document" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
