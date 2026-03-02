import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "templates";

  return NextResponse.json({
    ok: true,
    type,
    templates: [
      { id: "vr-basic", name: "Basic VR Scene", description: "WebXR VR starter with locomotion and interactions", targetFPS: 90 },
      { id: "ar-marker", name: "AR Marker Tracking", description: "Marker-based AR with 3D model overlay", platforms: ["Android", "iOS"] },
      { id: "360-viewer", name: "360° Viewer", description: "Immersive 360-degree photo and video viewer with hotspots", formats: ["equirectangular", "cubemap"] },
      { id: "metaverse-space", name: "Metaverse Space", description: "Social metaverse space with avatars and NFT gallery", features: ["multiplayer", "nft-gallery", "voice-chat"] },
      { id: "product-visualizer", name: "3D Product Visualizer", description: "E-commerce 3D product viewer with AR try-on", formats: ["glTF", "USDZ"] },
      { id: "data-visualization-3d", name: "3D Data Visualization", description: "Immersive data exploration in 3D space", chartTypes: ["scatter3d", "network", "globe"] },
    ],
    supportedFormats: ["glTF", "GLB", "USDZ", "FBX", "OBJ", "COLLADA", "STL", "PLY"],
    devices: ["Meta Quest 2", "Meta Quest 3", "Apple Vision Pro", "HTC Vive", "Valve Index", "PlayStation VR2", "Magic Leap 2"],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, description, template } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    if (action === "generate-xr-app") {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
      }
      if (!description) {
        return NextResponse.json({ error: "Description required" }, { status: 400 });
      }

      const r = await getClient().responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "You are a WebXR expert. Generate WebXR application code using Three.js and the WebXR Device API. Return ONLY the HTML/JavaScript code.",
          },
          { role: "user", content: `Generate a WebXR experience for: ${description}` },
        ],
      });

      const code = (r as any).output_text ?? "";
      return NextResponse.json({
        ok: true, action,
        experience: { id: `xr-${Date.now()}`, description, template, code, createdAt: new Date().toISOString() },
      });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "XR action failed" }, { status: 500 });
  }
}
