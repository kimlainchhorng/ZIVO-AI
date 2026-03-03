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
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt;
    const sceneType: string = body?.sceneType || "object";

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const sceneHint = SCENE_INSTRUCTIONS[sceneType] ?? SCENE_INSTRUCTIONS["object"];

    const systemPrompt = `You are an expert Three.js developer. Generate a complete, self-contained HTML page that renders a 3D scene using Three.js from CDN.

Requirements:
- Import Three.js ONLY from: https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js
- The page must be fully self-contained — all CSS and JS inline, no external resources except the Three.js CDN
- Use THREE.WebGLRenderer with antialias:true, set background color to #0a0b14
- Canvas must fill the entire viewport (width: 100vw, height: 100vh, margin: 0, padding: 0)
- Add ambient light + at least one directional or point light
- Implement a smooth animation loop using requestAnimationFrame
- Add auto-rotation or gentle floating animation so the scene looks alive
- Implement simple mouse-drag orbit: on mousedown/mousemove rotate the camera target around Y and X axes
- The scene must be interesting, detailed, and match the user's prompt
- ${sceneHint}
- Output ONLY the raw HTML (starting with <!DOCTYPE html>), no markdown fences, no explanation.`;

    const userMessage = `Create a Three.js 3D scene for: ${prompt}`;

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.6,
      max_tokens: 4000,
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
