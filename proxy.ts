import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ["/ai/:path*"],
};