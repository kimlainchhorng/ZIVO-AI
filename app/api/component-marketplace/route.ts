import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COMPONENTS = [
  { id: "1", name: "Button", category: "UI", tags: ["ui", "interactive"], version: "1.2.0" },
  { id: "2", name: "Card", category: "Layout", tags: ["layout", "ui"], version: "1.0.1" },
  { id: "3", name: "Form", category: "Forms", tags: ["forms", "validation"], version: "2.1.0" },
  { id: "4", name: "Modal", category: "Overlay", tags: ["overlay", "ui"], version: "1.3.2" },
  { id: "5", name: "Table", category: "Data", tags: ["data", "ui"], version: "1.1.0" },
  { id: "6", name: "Dropdown", category: "UI", tags: ["ui", "forms"], version: "1.0.3" },
];

export async function GET() {
  return NextResponse.json({ description: "Component marketplace CRUD API", components: COMPONENTS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = body.action as string | undefined;
    const query = body.query as string | undefined;

    if (action === "list" || !action) {
      return NextResponse.json({ components: COMPONENTS });
    }

    if (action === "search") {
      const q = (query ?? "").toLowerCase();
      const results = COMPONENTS.filter(
        (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.tags.some((t) => t.includes(q))
      );
      return NextResponse.json({ components: results });
    }

    if (action === "install") {
      const component = COMPONENTS.find((c) => c.id === query);
      if (!component) return NextResponse.json({ error: "Component not found" }, { status: 404 });
      return NextResponse.json({ success: true, installed: component });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
