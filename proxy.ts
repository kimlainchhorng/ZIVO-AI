import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.openai.com;"
  );
  return response;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/ai")) {
    const required = process.env.AI_BUILDER_PASSWORD;

    if (required) {
      const password = req.cookies.get("ai_pw")?.value;

      if (password !== required) {
        const url = req.nextUrl.clone();
        url.pathname = "/ai-login";
        url.searchParams.set("next", pathname);
        const redirectResponse = NextResponse.redirect(url);
        return addSecurityHeaders(redirectResponse);
      }
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};