import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ description: "Upload assets and return mock upload result with URL." });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const mockUrl = `/uploads/${Date.now()}-${safeFileName}`;

    return NextResponse.json({
      success: true,
      url: mockUrl,
      name: file.name,
      type: file.type,
      size: `${Math.round(file.size / 1024)} KB`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
