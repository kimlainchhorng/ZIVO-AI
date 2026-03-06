import { NextResponse } from "next/server";
import OpenAI from "openai";
import { WEBSITE_BUILDER_SYSTEM_PROMPT } from "../../../prompts/website-builder";
import { fixBrokenImages } from "../../../lib/html-processor";
import { generateFullProject } from "../../../lib/ai/master-project-generator";
import { runMultiPassGeneration } from "../../../lib/ai/multi-pass-generator";
import type { ProjectBlueprint } from "../../../lib/ai/passes/pass1-plan";
import {
  getProject,
  createProject,
  addFiles as addProjectFiles,
  updateProject,
  addConversationTurn,
} from "../../../lib/project-memory";
import { buildContextSnapshot } from "../../../lib/ai/context-snapshot";

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
  env?: string[];
  routes?: string[];
  commands?: string[];
  warnings?: string[];
  missing_env?: string[];
  next_steps?: string[];
  blueprint?: ProjectBlueprint;
  passLog?: string[];
  projectId?: string;
  iterationCount?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProjectMemoryInput {
  name?: string;
  framework?: string;
  designSystem?: {
    primaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
  pages?: Array<{ route: string; description: string }>;
  components?: string[];
  lastUpdated?: number;
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
  "preview_html": "<!DOCTYPE html>...(single self-contained HTML file for live preview)...",
  "summary": "Brief description of what was built",
  "notes": "Any additional notes"
}`;

const SYSTEM_PROMPT_STANDARD = `You are ZIVO AI — the world's most advanced AI builder, generating code that rivals Lovable, v0.dev, and Bolt.new.

## CRITICAL: GENERATE COMPLETE MULTI-FILE PROJECTS
⚠️ You MUST generate a MINIMUM of 10 files. A single HTML file is NOT acceptable.
Generate a complete Next.js project with proper structure: layout, pages, components, styles, config.

## CRITICAL: DESIGN QUALITY STANDARDS
Your output must look like a $10,000 custom-built app. NOT a tutorial project. NOT a template. A REAL production app that users would pay for.

## MANDATORY RULES FOR EVERY BUILD

### ⚠️ Images: MANDATORY — NEVER USE BROKEN IMAGE TAGS
- ⚠️ REQUIRED: ALWAYS use real placeholder images from: https://picsum.photos/[width]/[height]?random=[number]
- For product images: https://picsum.photos/400/300?random=1, ?random=2, ?random=3, etc.
- For avatars: https://i.pravatar.cc/150?img=1, ?img=2, etc.
- For hero backgrounds: https://picsum.photos/1920/1080?random=10
- For logos: Use CSS-drawn SVG logos or emoji-based logos
- ⚠️ NEVER use empty src="" or /placeholder.jpg or broken image paths

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

## REQUIRED FILES TO GENERATE (minimum 10, aim for 15+)
Always generate ALL of these:
1. app/layout.tsx — root layout with fonts and providers
2. app/globals.css — global styles + CSS variables
3. app/page.tsx — homepage with all sections
4. app/about/page.tsx — about page
5. app/contact/page.tsx — contact form page
6. app/not-found.tsx — 404 page
7. components/Navbar.tsx — sticky navbar with mobile menu
8. components/Footer.tsx — full footer with links
9. components/Hero.tsx — hero section
10. components/Features.tsx — features/benefits section
11. tailwind.config.ts — Tailwind config with custom tokens
12. package.json — all dependencies

Also generate type-specific files:
- E-commerce: components/ProductGrid.tsx, components/CartDrawer.tsx, app/products/page.tsx
- Dashboard: components/Sidebar.tsx, components/StatsCard.tsx, app/dashboard/page.tsx
- SaaS/Landing: components/Pricing.tsx, components/Testimonials.tsx, app/pricing/page.tsx
- Portfolio: components/ProjectCard.tsx, components/Timeline.tsx, app/projects/page.tsx

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown fences):
{
  "files": [
    { "path": "app/layout.tsx", "content": "...", "action": "create" },
    { "path": "app/globals.css", "content": "...", "action": "create" },
    { "path": "app/page.tsx", "content": "...", "action": "create" },
    { "path": "app/about/page.tsx", "content": "...", "action": "create" },
    { "path": "app/contact/page.tsx", "content": "...", "action": "create" },
    { "path": "app/not-found.tsx", "content": "...", "action": "create" },
    { "path": "components/Navbar.tsx", "content": "...", "action": "create" },
    { "path": "components/Footer.tsx", "content": "...", "action": "create" },
    { "path": "components/Hero.tsx", "content": "...", "action": "create" },
    { "path": "components/Features.tsx", "content": "...", "action": "create" },
    { "path": "tailwind.config.ts", "content": "...", "action": "create" },
    { "path": "package.json", "content": "...", "action": "create" }
  ],
  "preview_html": "<!DOCTYPE html>...(complete self-contained HTML preview with ALL CSS/JS inline)...",
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

// ─── Smart model routing ──────────────────────────────────────────────────────
// Use o1-mini for logic-heavy prompts; gpt-4o for general code generation.
const LOGIC_HEAVY_PATTERNS = [
  /\bauth(?:entication|orization|oriz)\b/i,
  /\bjwt\b/i,
  /\boauth\b/i,
  /\bsession\b/i,
  /\balgorithm\b/i,
  /\brecursion\b/i,
  /\bdynamic\s+programming\b/i,
  /\bsort(?:ing)?\s+algorithm\b/i,
  /\bdatabase\s+schema\b/i,
  /\bmigration\b/i,
  /\bstate\s+machine\b/i,
  /\bcryptograph/i,
  /\bhashing\b/i,
];

function _selectModel(prompt: string, requestedModel?: string): string {
  // Honour an explicitly requested model from the caller
  if (requestedModel && requestedModel !== "auto") return requestedModel;
  const isLogicHeavy = LOGIC_HEAVY_PATTERNS.some((re) => re.test(prompt));
  return isLogicHeavy ? "o1-mini" : "gpt-4o";
}

async function generateFiles(
  prompt: string,
  mode: GenerateMode,
  context: ChatMessage[],
  projectMemoryContext?: string,
  existingFiles?: GeneratedFile[],
  requestedModel?: string
): Promise<GenerateSiteResponse> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: getSystemPrompt(mode) },
  ];

  // Inject prior context for multi-turn building
  for (const m of context) {
    messages.push({ role: m.role, content: m.content });
  }

  // Prepend project memory context and existing files to user prompt if available
  let userContent = projectMemoryContext
    ? `Project context:\n${projectMemoryContext}\n\nRequest: ${prompt}`
    : prompt;

  if (existingFiles && existingFiles.length > 0) {
    const filesSummary = existingFiles
      .map((f) => `- ${f.path} (${f.content.length} chars)`)
      .join("\n");
    userContent = `Existing files in project:\n${filesSummary}\n\n${userContent}\n\nUpdate or extend the existing files as needed. Preserve existing functionality.`;
  }

  messages.push({ role: "user", content: userContent });

  const chosenModel = _selectModel(prompt, requestedModel);
  const isO1 = chosenModel.startsWith("o1");

  const response = await getClient().chat.completions.create({
    model: chosenModel,
    ...(isO1 ? { max_completion_tokens: 32000 } : { temperature: 0.3, max_tokens: 32000 }),
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

function getIterationCount(pid: string | undefined): number | undefined {
  if (!pid) return undefined;
  return getProject(pid)?.iterationCount;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body?.prompt || "";
    const mode: GenerateMode = ["standard", "advanced", "minimal"].includes(body?.mode)
      ? (body.mode as GenerateMode)
      : "standard";
    // Accept an explicit model override from the caller ("auto" defers to smart routing)
    const requestedModel: string | undefined = typeof body?.model === "string" ? body.model : undefined;
    const context: ChatMessage[] = Array.isArray(body?.context)
      ? (body.context as Array<{ role: string; content: string }>)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    // Accept projectId for project memory integration
    const projectId: string | undefined = typeof body?.projectId === "string" ? body.projectId : undefined;

    // Load project memory and build context snapshot when projectId provided
    let memoryProject = projectId ? getProject(projectId) : undefined;
    if (projectId && !memoryProject) {
      // Auto-create project if not found
      memoryProject = createProject(projectId, prompt);
    }
    const contextSnapshot = buildContextSnapshot(memoryProject);

    // Accept existing files for iterative builds; prefer memory files if available
    let existingFiles: GeneratedFile[] = Array.isArray(body?.existingFiles)
      ? (body.existingFiles as GeneratedFile[]).filter(
          (f) => typeof f.path === "string" && typeof f.content === "string"
        )
      : [];

    // If memory has files and no explicit existingFiles were sent, use memory files
    if (contextSnapshot.isFollowUp && existingFiles.length === 0) {
      existingFiles = (memoryProject?.files ?? []).map((f) => ({
        path: f.path,
        content: f.content,
        action: "update" as const,
      }));
    }

    // Multi-pass mode: default true for SaaS/complex, false for simple landing pages
    const multiPass: boolean = typeof body?.multiPass === "boolean"
      ? body.multiPass
      : mode !== "minimal";

    // Build project memory context string if provided (legacy) or from snapshot
    let projectMemoryContext: string | undefined;
    const legacyProjectMemory = body?.projectMemory as ProjectMemoryInput | undefined;
    if (legacyProjectMemory && typeof legacyProjectMemory === "object") {
      const parts: string[] = [];
      if (legacyProjectMemory.name) parts.push(`App name: ${legacyProjectMemory.name}`);
      if (legacyProjectMemory.framework) parts.push(`Framework: ${legacyProjectMemory.framework}`);
      if (legacyProjectMemory.designSystem) {
        const ds = legacyProjectMemory.designSystem;
        parts.push(`Design system: primaryColor=${ds.primaryColor ?? ""}, fontFamily=${ds.fontFamily ?? ""}, borderRadius=${ds.borderRadius ?? ""}`);
      }
      if (Array.isArray(legacyProjectMemory.pages) && legacyProjectMemory.pages.length) {
        const pagesStr = legacyProjectMemory.pages.map((p) => `${p.route}: ${p.description}`).join(", ");
        parts.push(`Existing pages: ${pagesStr}`);
      }
      if (Array.isArray(legacyProjectMemory.components) && legacyProjectMemory.components.length) {
        parts.push(`Existing components: ${legacyProjectMemory.components.join(", ")}`);
      }
      if (parts.length) projectMemoryContext = parts.join("\n");
    }

    // Augment context with snapshot data when this is a follow-up
    if (contextSnapshot.isFollowUp) {
      const snapshotParts: string[] = [];
      if (contextSnapshot.techStackContext) snapshotParts.push(contextSnapshot.techStackContext);
      if (contextSnapshot.blueprintSummary) snapshotParts.push(`Previous blueprint:\n${contextSnapshot.blueprintSummary}`);
      if (contextSnapshot.conversationContext) snapshotParts.push(`Recent conversation:\n${contextSnapshot.conversationContext}`);
      snapshotParts.push(`Existing files (${contextSnapshot.existingFileCount}): ${contextSnapshot.existingFilePaths.slice(0, 20).join(", ")}`);
      if (snapshotParts.length) {
        projectMemoryContext = projectMemoryContext
          ? `${projectMemoryContext}\n${snapshotParts.join("\n")}`
          : snapshotParts.join("\n");
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // Store the user's prompt turn in memory before generation
    if (projectId) {
      addConversationTurn(projectId, "user", prompt);
    }

    // Use multi-pass generator when requested (plan → generate → validate+fix)
    if (multiPass && mode !== "minimal") {
      let multiPassResult: Awaited<ReturnType<typeof runMultiPassGeneration>>;
      try {
        const fullPrompt = projectMemoryContext
          ? `Project context:\n${projectMemoryContext}\n\nRequest: ${prompt}`
          : prompt;
        multiPassResult = await runMultiPassGeneration(fullPrompt, existingFiles);
      } catch (error) {
        console.error("Multi-pass generator failed:", error);
        return NextResponse.json(
          { error: `Multi-pass generation failed: ${error instanceof Error ? error.message : "Unknown error"}` },
          { status: 500 }
        );
      }

      const { blueprint, output, pass3Result, passLog } = multiPassResult;

      // Post-process: fix broken images in preview_html
      if (output.preview_html) {
        output.preview_html = fixBrokenImages(output.preview_html);
      }

      const allWarnings = [
        ...(output.warnings ?? []),
        ...pass3Result.remainingIssues,
      ];

      // Save blueprint + files to project memory
      if (projectId && output.files?.length) {
        updateProject(projectId, { blueprint: blueprint ?? null, techStack: blueprint?.techStack ?? [] });
        addProjectFiles(projectId, output.files.map((f) => ({ path: f.path, content: f.content })));
        addConversationTurn(projectId, "assistant", output.summary ?? `Generated ${output.files.length} files.`);
      }

      const response: GenerateSiteResponse = {
        thinking: output.thinking,
        files: output.files as GeneratedFile[],
        preview_html: output.preview_html,
        summary: output.summary,
        env: output.env,
        routes: output.routes,
        commands: output.commands,
        warnings: allWarnings,
        missing_env: output.missing_env,
        next_steps: output.next_steps,
        blueprint,
        passLog,
        projectId: projectId ?? undefined,
        iterationCount: getIterationCount(projectId),
      };

      return NextResponse.json(response);
    }

    // Use master project generator for standard/advanced modes (single-pass)
    if (mode !== "minimal") {
      let result: Awaited<ReturnType<typeof generateFullProject>>;
      try {
        // Prepend project memory context to prompt if available
        const fullPrompt = projectMemoryContext
          ? `Project context:\n${projectMemoryContext}\n\nRequest: ${prompt}`
          : prompt;
        result = await generateFullProject(fullPrompt, existingFiles);
      } catch (error) {
        console.error("Master generator failed:", error);
        return NextResponse.json(
          { error: `Invalid JSON from AI: ${error instanceof Error ? error.message : "Unknown error"}` },
          { status: 500 }
        );
      }

      const { output, validationResult } = result;

      // Post-process: fix broken images in preview_html
      if (output.preview_html) {
        output.preview_html = fixBrokenImages(output.preview_html);
      }

      // Merge validation warnings into output warnings
      const allWarnings = [...(output.warnings ?? []), ...validationResult.warnings];

      // Save files to project memory
      if (projectId && output.files?.length) {
        addProjectFiles(projectId, output.files.map((f) => ({ path: f.path, content: f.content })));
        addConversationTurn(projectId, "assistant", output.summary ?? `Generated ${output.files.length} files.`);
      }

      const response: GenerateSiteResponse = {
        thinking: output.thinking,
        files: output.files as GeneratedFile[],
        preview_html: output.preview_html,
        summary: output.summary,
        env: output.env,
        routes: output.routes,
        commands: output.commands,
        warnings: allWarnings,
        missing_env: output.missing_env,
        next_steps: output.next_steps,
        projectId: projectId ?? undefined,
        iterationCount: getIterationCount(projectId),
      };

      return NextResponse.json(response);
    }

    // Minimal mode: use the legacy generator
    let parsed: GenerateSiteResponse;
    try {
      parsed = await generateFiles(prompt, mode, context, projectMemoryContext, existingFiles.length > 0 ? existingFiles : undefined, requestedModel);
    } catch {
      return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
    }

    if (!Array.isArray(parsed.files)) {
      parsed.files = [];
    }

    // Self-correction loop (max 2 retries)
    const corrected = await selfCorrect(parsed);

    // Post-process: fix broken images in preview_html
    if (corrected.preview_html) {
      corrected.preview_html = fixBrokenImages(corrected.preview_html);
    }

    // Save files to project memory for minimal mode
    if (projectId && corrected.files?.length) {
      addProjectFiles(projectId, corrected.files.map((f) => ({ path: f.path, content: f.content })));
      addConversationTurn(projectId, "assistant", corrected.summary ?? `Generated ${corrected.files.length} files.`);
    }

    return NextResponse.json({
      ...corrected,
      projectId: projectId ?? undefined,
      iterationCount: getIterationCount(projectId),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
