import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TEMPLATES = [
  { id: "t1", name: "SaaS Starter", category: "SaaS", stars: 1240 },
  { id: "t2", name: "Blog Platform", category: "Blog", stars: 876 },
  { id: "t3", name: "E-commerce Store", category: "E-commerce", stars: 2103 },
  { id: "t4", name: "Admin Dashboard", category: "Dashboard", stars: 1567 },
  { id: "t5", name: "Portfolio", category: "Portfolio", stars: 934 },
  { id: "t6", name: "API Service", category: "API", stars: 712 },
];

export async function GET() {
  return NextResponse.json({ description: "Template marketplace API", templates: TEMPLATES });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = body.action as string | undefined;
    const templateId = body.templateId as string | undefined;

    if (action === "list" || !action) {
      return NextResponse.json({ templates: TEMPLATES });
    }

    if (action === "search") {
      const q = (body.query as string ?? "").toLowerCase();
      const results = TEMPLATES.filter((t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
      return NextResponse.json({ templates: results });
    }

    if (action === "clone") {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
      return NextResponse.json({
        success: true,
        template,
        cloneUrl: `https://github.com/zivo-ai/${template.name.toLowerCase().replace(/\s+/g, "-")}`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
