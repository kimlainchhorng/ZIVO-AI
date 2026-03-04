import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";
type ImageQuality = "standard" | "hd";
type ImageStyle = "vivid" | "natural";
type ImagePurpose = "hero" | "illustration" | "icon" | "logo" | "og-image";

interface DalleImageObject {
  b64_json?: string;
  url?: string;
}

interface DalleResponse {
  data: DalleImageObject[];
}

export async function POST(req: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as {
    prompt: string;
    size?: ImageSize;
    quality?: ImageQuality;
    style?: ImageStyle;
    purpose?: ImagePurpose;
  };

  if (!body.prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const size: ImageSize = body.size ?? "1024x1024";
  const quality: ImageQuality = body.quality ?? "standard";
  const style: ImageStyle = body.style ?? "vivid";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: body.prompt,
      n: 1,
      size,
      quality,
      style,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: `Image generation failed: ${errorText}` }, { status: response.status });
  }

  const data = (await response.json()) as DalleResponse;
  const imageObject = data.data[0];

  const dataUrl = imageObject?.b64_json
    ? `data:image/png;base64,${imageObject.b64_json}`
    : "";

  return NextResponse.json({
    type: "image",
    dataUrl,
    url: imageObject?.url ?? "",
    size,
    prompt: body.prompt,
    purpose: body.purpose ?? null,
  });
}
