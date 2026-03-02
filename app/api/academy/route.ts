import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * AI Academy API
 * GET  /api/academy  – list available courses
 * POST /api/academy  – enroll in a course
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    courses: [
      {
        id: "intro-to-zivo",
        title: "Introduction to ZIVO AI",
        description: "Learn the fundamentals of AI application generation.",
        level: "beginner",
        durationHours: 2,
        certified: true,
      },
      {
        id: "advanced-prompts",
        title: "Advanced Prompt Engineering",
        description: "Master prompting techniques for production-grade outputs.",
        level: "advanced",
        durationHours: 4,
        certified: true,
      },
    ],
    total: 2,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { userId, courseId } = body as { userId?: string; courseId?: string };

  if (!userId || !courseId) {
    return NextResponse.json({ error: "userId and courseId required" }, { status: 400 });
  }

  // TODO: create enrollment record and send welcome email
  return NextResponse.json({
    ok: true,
    enrollment: {
      id: crypto.randomUUID(),
      userId,
      courseId,
      progress: 0,
      enrolledAt: new Date().toISOString(),
    },
  });
}
