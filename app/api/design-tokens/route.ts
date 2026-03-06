import { NextResponse } from "next/server";
import { generateTokens, tokensToCSS, tokensToTailwind, type BrandConfig } from "../../../lib/design-tokens";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { brandName, primaryColor, style = "modern" } = body as {
      brandName?: string;
      primaryColor?: string;
      style?: "modern" | "playful" | "corporate" | "minimal";
    };

    if (!primaryColor) {
      return NextResponse.json({ error: "primaryColor is required (hex, e.g. #3B82F6)" }, { status: 400 });
    }

    // Validate hex color
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
      return NextResponse.json({ error: "primaryColor must be a valid 6-digit hex color (e.g. #3B82F6)" }, { status: 400 });
    }

    const brand: BrandConfig = { primaryColor, brandName, style };
    const tokens = generateTokens(brand);
    const css = tokensToCSS(tokens);
    const tailwind = tokensToTailwind(tokens);

    return NextResponse.json({ tokens, css, tailwind });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
