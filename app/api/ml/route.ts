import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "models";

  return NextResponse.json({
    ok: true,
    type,
    models: [
      { id: "model-1", name: "Churn Predictor", framework: "TensorFlow.js", accuracy: 94.2, status: "deployed", requests: 1240 },
      { id: "model-2", name: "Sentiment Analyzer", framework: "TensorFlow.js", accuracy: 91.8, status: "deployed", requests: 3420 },
      { id: "model-3", name: "Image Classifier", framework: "PyTorch", accuracy: 96.1, status: "staging", requests: 0 },
      { id: "model-4", name: "Demand Forecaster", framework: "scikit-learn", accuracy: 88.4, status: "deployed", requests: 580 },
    ],
    aiProviders: [
      { id: "gpt4", name: "GPT-4.1", provider: "OpenAI", costPer1kTokens: 0.015, available: true },
      { id: "claude", name: "Claude 3.5 Sonnet", provider: "Anthropic", costPer1kTokens: 0.018, available: true },
      { id: "gemini", name: "Gemini Ultra", provider: "Google", costPer1kTokens: 0.012, available: true },
      { id: "llama", name: "Llama 3.3 70B", provider: "Meta (self-hosted)", costPer1kTokens: 0.002, available: true },
    ],
    vectorDatabases: ["Pinecone", "Weaviate", "Qdrant", "Chroma", "pgvector", "Redis Vector"],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, description, modelType, framework } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    if (action === "generate-model-pipeline") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }
      if (!description) {
        return NextResponse.json({ error: "Description required" }, { status: 400 });
      }

      const fw = framework || "TensorFlow.js";
      const r = await getClient().responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: `You are an ML engineer. Generate a complete ${fw} model training and serving pipeline. Return ONLY the code.`,
          },
          { role: "user", content: `Generate an ML pipeline for: ${description}. Model type: ${modelType || "classification"}` },
        ],
      });

      const code = (r as any).output_text ?? "";
      return NextResponse.json({
        ok: true, action,
        pipeline: { id: `ml-${Date.now()}`, description, framework: fw, modelType, code, createdAt: new Date().toISOString() },
      });
    }

    if (action === "generate-rag-setup") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }

      const vectorDb = body.vectorDb || "Pinecone";
      const r = await getClient().responses.create({
        model: "gpt-4.1-mini",
        input: `Generate a complete RAG (Retrieval-Augmented Generation) setup using ${vectorDb} as the vector database. Include document ingestion, embedding, retrieval, and generation. Return ONLY TypeScript code.`,
      });

      const code = (r as any).output_text ?? "";
      return NextResponse.json({ ok: true, action, rag: { vectorDb, code } });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "ML action failed" }, { status: 500 });
  }
}
