import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Post {
  id: string;
  title: string;
  author: string;
  category: string;
  replies: number;
  createdAt: string;
}

export async function GET() {
  return NextResponse.json({
    stats: {
      totalMembers: 8420,
      activeThisWeek: 1230,
      postsThisMonth: 540,
      upcomingEvents: 3,
    },
    recentPosts: [
      {
        id: "P-001",
        title: "How I increased retention by 40% using ZIVO",
        author: "user_jane",
        category: "case-study",
        replies: 14,
        createdAt: "2025-07-10T08:00:00.000Z",
      },
      {
        id: "P-002",
        title: "Tips for the analytics dashboard",
        author: "user_mark",
        category: "tips",
        replies: 7,
        createdAt: "2025-07-09T16:45:00.000Z",
      },
    ] satisfies Post[],
    discussions: [
      { id: "D-001", topic: "Roadmap Q3 2025", participants: 38, status: "open" },
      { id: "D-002", topic: "Best practices for onboarding", participants: 22, status: "open" },
    ],
    events: [
      { id: "E-001", name: "Community AMA", date: "2025-07-20", registrations: 145 },
      { id: "E-002", name: "Product Webinar", date: "2025-08-05", registrations: 210 },
    ],
    badges: [
      { id: "B-01", name: "Early Adopter", awardedTo: 320 },
      { id: "B-02", name: "Top Contributor", awardedTo: 48 },
    ],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, author, category } = body as {
      title?: string;
      author?: string;
      category?: string;
    };
    if (!title || !author) {
      return NextResponse.json(
        { error: "Missing required fields: title, author" },
        { status: 400 }
      );
    }
    const post: Post = {
      id: `P-${Date.now()}`,
      title,
      author,
      category: category ?? "general",
      replies: 0,
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
