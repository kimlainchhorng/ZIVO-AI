import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const sampleListings = [
  {
    id: "ds-001",
    type: "dataset",
    title: "Global E-commerce Trends 2024-2026",
    description: "150M+ transaction records across 50 countries",
    price: 299,
    currency: "USD",
    seller: "DataCorp Inc.",
    rating: 4.8,
    downloads: 2341,
    tags: ["e-commerce", "global", "retail"],
  },
  {
    id: "model-001",
    type: "ai_model",
    title: "Healthcare Diagnosis Assistant v2",
    description: "Fine-tuned model for medical symptom analysis",
    price: 499,
    currency: "USD",
    seller: "MedAI Labs",
    rating: 4.9,
    downloads: 891,
    tags: ["healthcare", "diagnosis", "nlp"],
  },
  {
    id: "tmpl-001",
    type: "template",
    title: "FinTech Dashboard Starter",
    description: "Complete fintech dashboard with analytics and charts",
    price: 149,
    currency: "USD",
    seller: "ZIVO AI",
    rating: 4.7,
    downloads: 5823,
    tags: ["fintech", "dashboard", "analytics"],
  },
  {
    id: "int-001",
    type: "integration",
    title: "Salesforce CRM Connector Pro",
    description: "Bi-directional sync with full Salesforce API coverage",
    price: 79,
    currency: "USD",
    seller: "IntegrationHub",
    rating: 4.6,
    downloads: 12044,
    tags: ["crm", "salesforce", "integration"],
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search")?.toLowerCase();

  let results = sampleListings;

  if (type) {
    results = results.filter((l) => l.type === type);
  }

  if (search) {
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(search) ||
        l.description.toLowerCase().includes(search) ||
        l.tags.some((t) => t.includes(search))
    );
  }

  return NextResponse.json({
    ok: true,
    total: results.length,
    listings: results,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, description, type, price, currency, tags } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "title and type are required" },
        { status: 400 }
      );
    }

    const listing = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      description: description || "",
      price: price || 0,
      currency: currency || "USD",
      seller: "You",
      rating: 0,
      downloads: 0,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, listing }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
