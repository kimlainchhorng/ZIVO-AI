import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 20 // 20 requests per minute

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const now = Date.now()
    const record = requestCounts.get(ip)

    if (record) {
      if (now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      } else if (record.count >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait before making more requests.' },
          { status: 429, headers: { 'Retry-After': '60' } }
        )
      } else {
        record.count++
      }
    } else {
      requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    }

    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return response
  }

  if (!pathname.startsWith("/ai")) {
    return NextResponse.next();
  }

  const required = process.env.AI_BUILDER_PASSWORD;

  if (!required) {
    return NextResponse.next();
  }

  const password = req.cookies.get("ai_pw")?.value;

  if (password === required) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/ai-login";
  url.searchParams.set("next", pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/ai/:path*", "/api/:path*"],
};
