import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Return empty stats - real data requires Supabase auth context
  return NextResponse.json({
    projects: [],
    stats: {
      totalProjects: 0,
      totalFiles: 0,
      recentActivity: [],
    },
  });
}
