// GET /api/health — returns system health status
export const runtime = "nodejs";
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? "unknown",
    openai: Boolean(process.env.OPENAI_API_KEY),
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    version: process.env.npm_package_version ?? "0.0.0",
  });
}
