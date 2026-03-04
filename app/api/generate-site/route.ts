import { NextResponse } from "next/server";
import OpenAI from "openai";
import { WEBSITE_BUILDER_SYSTEM_PROMPT } from "../../../prompts/website-builder";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export type FileAction = "create" | "update" | "delete";

export interface GeneratedFile {
  path: string;
  content: string;
  action: FileAction;
}

export interface GenerateSiteResponse {
  thinking?: string;
  files: GeneratedFile[];
  preview_html?: string;
  summary?: string;
  notes?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type GenerateMode = "standard" | "advanced" | "minimal";

const BASE_RULES = `
Rules:
- ALWAYS include a \`preview_html\` field: a single complete self-contained HTML file with ALL CSS inline in <style> tags and ALL JS inline in <script> tags. No external CDN links that might fail.
- Each file in \`files\` must have a \`path\`, \`content\`, and \`action\` ("create" | "update" | "delete").
- Make the UI beautiful: use modern CSS, gradients, good typography, proper spacing.
- The HTML preview should look like a real polished app, not a demo.
- Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "files": [
    { "path": "app/page.tsx", "content": "..." }
  ],
  "description": "..."
}`;

const SYSTEM_PROMPT_STANDARD = `You are ZIVO AI — the world's most advanced AI builder, generating code that rivals Lovable, v0.dev, and Bolt.new.

## CRITICAL: DESIGN QUALITY STANDARDS
Your output must look like a $10,000 custom-built app. NOT a tutorial project. NOT a template. A REAL production app that users would pay for.

## MANDATORY RULES FOR EVERY BUILD

### Images: NEVER USE BROKEN IMAGE TAGS
- ALWAYS use real placeholder images from: https://picsum.photos/[width]/[height]?random=[number]
- For product images: https://picsum.photos/400/300?random=1, ?random=2, ?random=3, etc.
- For avatars: https://i.pravatar.cc/150?img=1, ?img=2, etc.
- For hero backgrounds: https://picsum.photos/1920/1080?random=10
- For logos: Use CSS-drawn SVG logos or emoji-based logos

### Color & Visual Design
- Use a UNIQUE, beautiful color palette (not default purple/white)
- Use CSS custom properties for the design system:
  --color-primary: (pick something beautiful like #6366f1, #ec4899, #14b8a6, #f59e0b)
  --color-secondary, --color-accent, --color-bg, --color-surface, --color-text
- Use glassmorphism: background: rgba(255,255,255,0.1); backdrop-filter: blur(10px);
- Use gradients: linear-gradient(135deg, #667eea 0%, #764ba2 100%) etc.
- Use box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)
- Dark mode by default OR a stunning light theme — never plain white

### CSS Animations (REQUIRED)
- Add @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
- Add @keyframes slideIn, @keyframes pulse for interactive elements
- Cards must have: transition: transform 0.3s ease, box-shadow 0.3s ease;
- Cards must have hover: transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.2);
- Buttons must have: transition: all 0.2s ease; hover: transform: scale(1.05);
- Use animation-delay for staggered entrance effects

### Typography
- Import Google Fonts: Inter, Plus Jakarta Sans, or Outfit
- Large headings: font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800;
- Body: font-size: 1rem; line-height: 1.7; color: var(--color-text-secondary);
- Use font-feature-settings: "kern" 1; text-rendering: optimizeLegibility;

### Layout
- Max content width: 1280px, centered with margin: 0 auto; padding: 0 1.5rem;
- Use CSS Grid for product/card layouts: grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
- Sections need generous padding: padding: 5rem 1.5rem;
- Use backdrop-filter for glass effects on navbar: backdrop-filter: blur(12px);

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown fences):
{
  "files": [
    {
      "path": "index.html",
      "content": "COMPLETE self-contained HTML with all CSS + JS inline. Must be stunning.",
      "action": "create"
    },
    {
      "path": "app/page.tsx",
      "content": "React/Next.js version of the same app",
      "action": "create"
    }
  ],
  "preview_html": "SAME as index.html content — the complete self-contained preview",
  "summary": "What was built and key design decisions"
}

## FOR E-COMMERCE SPECIFICALLY
When asked to build e-commerce:
- Product grid with REAL placeholder images (picsum.photos)
- Animated cart sidebar that slides in from the right
- Product cards with hover zoom effect on image
- "Add to Cart" button with pulse animation on click
- Cart counter badge with bounce animation
- Price with subtle formatting ($29.99 not 29.99)
- Star ratings using CSS ★ characters
- "New" / "Sale" badge overlays on product images
- Search bar in the navbar
- Category filter tabs

## FOR DASHBOARD/ANALYTICS
- Dark background (#0f172a or similar)
- Stat cards with gradient backgrounds and animated numbers
- Line/bar charts using CSS or Canvas
- Sidebar navigation with icons
- Recent activity feed

## FOR LANDING PAGES
- Full-height hero with gradient background
- Animated hero text with CSS gradient text
- Feature grid with icon illustrations (use SVGs)
- Social proof: logos + testimonials
- Pricing table with highlighted "popular" tier
- Smooth scroll between sections`;

const SYSTEM_PROMPT_MINIMAL = `You are ZIVO AI — an expert web developer that generates minimal, self-contained HTML files.

You are proficient in: TypeScript, JavaScript, HTML, CSS, JSON — with deep knowledge of modern CSS patterns, Flexbox, Grid, responsive design, and CSS animations.

When given a description, respond with a valid JSON object containing a SINGLE HTML file:
{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>...(complete, self-contained HTML with ALL CSS and JS inline)...",
      "action": "create"
    }
  ],
  "preview_html": "<!DOCTYPE html>...(same as the single HTML file)...",
  "summary": "Brief description of what was built",
  "notes": "Any additional notes"
}
${BASE_RULES}`;

const TYPE_CHECK_PROMPT = `You are a TypeScript expert. Review the following generated files for TypeScript type errors or obvious bugs.
If there are errors, return a corrected JSON object using the same schema (files, preview_html, summary, notes).
If there are no errors, return the original JSON unchanged.
Return ONLY valid JSON, no markdown, no explanation.`;

function getSystemPrompt(mode: GenerateMode): string {
  if (mode === "advanced") return WEBSITE_BUILDER_SYSTEM_PROMPT;
  if (mode === "minimal") return SYSTEM_PROMPT_MINIMAL;
  return SYSTEM_PROMPT_STANDARD;
}

async function generateFiles(
  prompt: string,
  mode: GenerateMode,
  context: ChatMessage[]
): Promise<GenerateSiteResponse> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: getSystemPrompt(mode) },
  ];

  // Inject prior context for multi-turn building
  for (const m of context) {
    messages.push({ role: m.role, content: m.content });
  }

  messages.push({ role: "user", content: prompt });

  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 16000,
    messages,
  });

  const text = response.choices?.[0]?.message?.content || "{}";
  return parseJSON(text);
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

function parseJSON(text: string): GenerateSiteResponse {
  const clean = stripMarkdownFences(text);
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

async function selfCorrect(
  parsed: GenerateSiteResponse,
  maxRetries: number = 2
): Promise<GenerateSiteResponse> {
  let current = parsed;
  let retries = 0;

  while (retries < maxRetries) {
    const checkResponse = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      max_tokens: 4000,
      messages: [
        { role: "system", content: TYPE_CHECK_PROMPT },
        { role: "user", content: JSON.stringify(current) },
      ],
    });

    const correctedText = checkResponse.choices?.[0]?.message?.content || "{}";
    let corrected: GenerateSiteResponse;
    try {
      corrected = parseJSON(correctedText);
    } catch {
      break;
    }

    const unchanged =
      corrected.files?.length === current.files?.length &&
      (corrected.files ?? []).every((f, i) => f.content === (current.files ?? [])[i]?.content);

    if (unchanged) break;

    current = corrected;
    retries++;
  }

  return current;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";
    const mode: GenerateMode = ["standard", "advanced", "minimal"].includes(body?.mode)
      ? (body.mode as GenerateMode)
      : "standard";
    const context: ChatMessage[] = Array.isArray(body?.context)
      ? (body.context as Array<{ role: string; content: string }>)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    let parsed: GenerateSiteResponse;
    try {
      parsed = await generateFiles(prompt, mode, context);
    } catch {
      return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    // Self-correction loop (max 2 retries)
    const corrected = await selfCorrect(parsed);

    return NextResponse.json(corrected);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
