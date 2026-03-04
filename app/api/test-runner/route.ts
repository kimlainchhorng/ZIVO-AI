import { NextResponse } from "next/server";
import { generateTests, type GeneratedFile } from "../../../lib/test-runner";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files, testFramework = "vitest" } = body as {
      files: unknown;
      testFramework?: "vitest" | "jest";
    };

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }

    for (const f of files) {
      if (!f || typeof (f as GeneratedFile).path !== "string" || typeof (f as GeneratedFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const result = await generateTests(files as GeneratedFile[], testFramework);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
