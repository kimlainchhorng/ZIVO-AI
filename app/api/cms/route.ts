import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  author: string;
  updatedAt: string;
  tags: string[];
}

const mockContent: ContentItem[] = [
  { id: "c1", title: "Getting Started Guide", type: "article", status: "published", author: "admin", updatedAt: new Date(Date.now() - 3600000).toISOString(), tags: ["guide", "onboarding"] },
  { id: "c2", title: "API Documentation", type: "docs", status: "published", author: "admin", updatedAt: new Date(Date.now() - 7200000).toISOString(), tags: ["api", "docs"] },
  { id: "c3", title: "Q4 Blog Post", type: "blog", status: "draft", author: "editor", updatedAt: new Date(Date.now() - 1800000).toISOString(), tags: ["blog", "marketing"] },
  { id: "c4", title: "Product Update Video", type: "media", status: "review", author: "editor", updatedAt: new Date(Date.now() - 900000).toISOString(), tags: ["video", "product"] },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";
  const status = searchParams.get("status") || "all";

  const filtered = mockContent.filter((c) => {
    const typeMatch = type === "all" || c.type === type;
    const statusMatch = status === "all" || c.status === status;
    return typeMatch && statusMatch;
  });

  return NextResponse.json({
    ok: true,
    items: filtered,
    total: filtered.length,
    stats: {
      total: mockContent.length,
      published: mockContent.filter((c) => c.status === "published").length,
      draft: mockContent.filter((c) => c.status === "draft").length,
      review: mockContent.filter((c) => c.status === "review").length,
    },
    integrations: [
      { id: "contentful", name: "Contentful", status: "connected", type: "headless-cms" },
      { id: "strapi", name: "Strapi", status: "available", type: "headless-cms" },
      { id: "sanity", name: "Sanity", status: "available", type: "headless-cms" },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, content } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    if (action === "create") {
      if (!content?.title) {
        return NextResponse.json({ error: "Content title required" }, { status: 400 });
      }
      const newItem: ContentItem = {
        id: `c-${Date.now()}`,
        title: content.title,
        type: content.type || "article",
        status: "draft",
        author: content.author || "user",
        updatedAt: new Date().toISOString(),
        tags: content.tags || [],
      };
      mockContent.push(newItem);
      return NextResponse.json({ ok: true, action, item: newItem });
    }

    if (action === "publish") {
      const id = body.id;
      const item = mockContent.find((c) => c.id === id);
      if (!item) {
        return NextResponse.json({ error: "Content not found" }, { status: 404 });
      }
      item.status = "published";
      item.updatedAt = new Date().toISOString();
      return NextResponse.json({ ok: true, action, item });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "CMS action failed" }, { status: 500 });
  }
}
