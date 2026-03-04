import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const SCENE_INSTRUCTIONS: Record<string, string> = {
  object: "Focus on a single detailed 3D object centered in the scene. Use interesting materials and lighting to showcase it.",
  scene: "Create an immersive environment with multiple objects, background elements, and atmospheric lighting.",
  character: "Model a stylized 3D character or creature with distinct geometry. Add idle animation or rotation.",
  game: `Create a playable Three.js mini-game (choose from: maze explorer, space shooter, or platformer).
Requirements:
- WASD or arrow key controls for player movement
- Collision detection using bounding boxes
- A score counter displayed as an HTML overlay (position: fixed, top-right)
- Game loop with requestAnimationFrame
- At least 3 enemy/obstacle objects that move or appear periodically
- Reset mechanic when player hits an obstacle`,
  "data-viz": `Create a 3D bar chart visualization from the provided data.
Requirements:
- Each bar: BoxGeometry with height proportional to value, different hue per bar
- X-axis labels using CSS2DRenderer or HTML overlay
- A title overlay showing the chart name
- Smooth camera auto-orbit so user can see the chart from multiple angles
- Axis lines using LineSegments`,
  product: `Create a 360° product viewer.
Requirements:
- OrbitControls for full orbit + zoom + pan
- Product sits on a reflective pedestal (PlaneGeometry with MeshStandardMaterial metalness/roughness)
- Soft studio lighting: 1 ambient + 2 directional rim lights + 1 point fill light
- Auto slow-rotate until the user interacts
- A hotspot system: 3 invisible sphere markers that show an HTML tooltip on hover`,
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt;
    const sceneType: string = body?.sceneType || "object";
    const data: Array<{ label: string; value: number }> | undefined = body?.data;
    const enableBloom: boolean = Boolean(body?.enableBloom);

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const sceneHint = SCENE_INSTRUCTIONS[sceneType] ?? SCENE_INSTRUCTIONS["object"];

    // Build data context for data-viz scene
    const dataContext = sceneType === "data-viz" && Array.isArray(data) && data.length > 0
      ? `\n\nChart data (label → value):\n${data.map((d) => `  ${d.label}: ${d.value}`).join("\n")}`
      : "";

    // Bloom post-processing instructions
    const bloomInstructions = enableBloom
      ? `\n\nPost-processing: Import UnrealBloomPass from three/examples via CDN and add a bloom effect with strength 1.5, radius 0.4, threshold 0.85. Use EffectComposer + RenderPass + UnrealBloomPass.`
      : "";

    const systemPrompt = `You are an expert Three.js developer. Generate a complete, self-contained HTML page that renders a 3D scene using Three.js from CDN.

Requirements:
- Use an importmap to load Three.js from esm.sh: { "imports": { "three": "https://esm.sh/three@0.160.0", "three/addons/": "https://esm.sh/three@0.160.0/examples/jsm/" } }
- Use <script type="module"> for all JavaScript
- Import OrbitControls from "three/addons/controls/OrbitControls.js" — this gives full orbit + zoom + pan
- The page must be fully self-contained — all CSS and JS inline, no external resources except Three.js from esm.sh
- Use THREE.WebGLRenderer with antialias:true, set background color to #0a0b14
- Canvas must fill the entire viewport (width: 100vw, height: 100vh, margin: 0, padding: 0)
- Add ambient light + at least one directional or point light
- Implement a smooth animation loop using requestAnimationFrame
- The scene must be interesting, detailed, and match the user's prompt
- ${sceneHint}${dataContext}${bloomInstructions}
- Output ONLY the raw HTML (starting with <!DOCTYPE html>), no markdown fences, no explanation.`;

    const userMessage = `Create a Three.js 3D ${sceneType} scene for: ${prompt}`;

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      max_tokens: 6000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    let html = completion.choices[0]?.message?.content ?? "";

    // Strip markdown fences if present
    html = html.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

    if (!html.includes("<html") && !html.includes("<!DOCTYPE")) {
      return NextResponse.json({ error: "Failed to generate valid HTML" }, { status: 500 });
    }

    const summary = `3D ${sceneType} scene: ${prompt.slice(0, 80)}${prompt.length > 80 ? "…" : ""}`;

    return NextResponse.json({ type: "3d", html, summary });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Server error" }, { status: 500 });
  }
}
