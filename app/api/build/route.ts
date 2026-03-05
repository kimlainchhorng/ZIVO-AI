// app/api/build/route.ts — SSE streaming build pipeline endpoint
// Accepts: POST { prompt, mode?, model?, projectId?, existingFiles?, projectMemory?, context? }
// Streams:  text/event-stream with stage/files/error events
// Modes: 'code' (default) | 'website_v2' | 'mobile_v2'

export const runtime = "nodejs";

import {
  extractBearerToken,
  getUserFromToken,
  createProject as dbCreateProject,
  getProject,
  getProjectFiles,
  upsertProjectFiles,
  appendProjectBuild,
} from "@/lib/db/projects-db";
import { runOrchestratorV4 } from "@/agents/orchestrator-v4";
import { ProgressStage } from "@/lib/ai/progress-events";
import type { GeneratedFile } from "@/lib/ai/schema";
import { generateWebsitePlan } from "@/lib/ai/website-plan";
import { generateMobilePlan } from "@/lib/ai/mobile-plan";
import { buildWebsiteManifest, buildMobileManifest } from "@/lib/ai/manifest-builders";
import { generateFromManifest } from "@/lib/ai/batch-generator";
import { evaluateWebsiteUI, evaluateMobileUI } from "@/lib/ai/ui-evaluator";
import { applyUIPolish } from "@/lib/ai/ui-polish";
import { generateSvgLogo, getFallbackSvgLogo } from "@/lib/ai/logo-generator";
import { validateAssets, summarizeAssetValidation } from "@/lib/ai/validators/assets-validator";
import { runCompletenessGate, summarizeCompletenessGate } from "@/lib/ai/validators/completeness-gate";
import type { ManifestFile } from "@/lib/ai/manifest";
import { createManifest } from "@/lib/ai/manifest";

export type BuildMode = "code" | "website_v2" | "mobile_v2";

type SSEStageType =
  | "BLUEPRINT"
  | "MANIFEST"
  | "GENERATING"
  | "VALIDATING"
  | "FIXING"
  | "COMPLETENESS_GATE"
  | "COMPLETENESS_GATE_FAILED"
  | "SECURITY_NOTE_CI"
  | "DONE";

interface StageEvent {
  type: "stage";
  stage: SSEStageType;
  message: string;
  progress?: number;
  /** Optional extra payload (e.g. list of missing items for COMPLETENESS_GATE_FAILED) */
  data?: unknown;
}

interface FilesEvent {
  type: "files";
  files: GeneratedFile[];
}

interface ErrorEvent {
  type: "error";
  message: string;
  details?: unknown;
}

type SSEEvent = StageEvent | FilesEvent | ErrorEvent;

const PROGRESS_STAGE_MAP: Partial<Record<ProgressStage, SSEStageType>> = {
  [ProgressStage.BLUEPRINT]: "BLUEPRINT",
  [ProgressStage.ARCHITECTURE]: "BLUEPRINT",
  [ProgressStage.MANIFEST]: "MANIFEST",
  [ProgressStage.GENERATING]: "GENERATING",
  [ProgressStage.VALIDATING]: "VALIDATING",
  [ProgressStage.FIXING]: "FIXING",
  [ProgressStage.DONE]: "DONE",
};

const MAX_POLISH_PASSES = 3;
const MIN_QUALITY_SCORE = 80;

function encodeSSE(event: SSEEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: Request): Promise<Response> {
  let body: {
    prompt?: string;
    mode?: string;
    model?: string;
    projectId?: string;
    existingFiles?: GeneratedFile[];
    projectMemory?: Record<string, unknown> | null;
    context?: unknown;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "Invalid JSON body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const { prompt, model = "gpt-4o" } = body;
  const mode: BuildMode =
    body.mode === "website_v2" || body.mode === "mobile_v2" ? body.mode : "code";

  if (!prompt?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "prompt is required" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "OPENAI_API_KEY is not configured" })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // ── Optional Supabase persistence ─────────────────────────────────────────
  // If the caller is authenticated (Bearer token present), we persist the
  // project/files/build to Supabase.  Unauthenticated callers get the same
  // build experience without persistence (no breaking change).
  const token = extractBearerToken(req.headers.get("Authorization"));
  const user = token ? await getUserFromToken(token) : null;

  let resolvedProjectId: string | null = body.projectId ?? null;
  let existingFiles: GeneratedFile[] = Array.isArray(body.existingFiles) ? body.existingFiles : [];

  // If authenticated and projectId supplied, load existing files from Supabase
  if (user && token && resolvedProjectId) {
    try {
      const proj = await getProject(token, resolvedProjectId);
      if (proj) {
        const dbFiles = await getProjectFiles(token, resolvedProjectId);
        if (dbFiles.length > 0) {
          existingFiles = dbFiles.map((f) => ({
            path: f.path,
            content: f.content,
            action: "update" as const,
          }));
        }
      }
    } catch {
      // Non-fatal: fall through with client-provided existingFiles
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SSEEvent): void => {
        try {
          controller.enqueue(encodeSSE(event));
        } catch {
          // Client disconnected; ignore enqueue errors
        }
      };

      // Heartbeat to keep the connection alive during long AI calls
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      let generatedFiles: GeneratedFile[] = [];
      let buildSummary = "";

      try {
        if (mode === "website_v2") {
          await runWebsiteV2Pipeline(prompt, model, (evt) => {
            send(evt);
            if (evt.type === "files") generatedFiles = (evt as FilesEvent).files;
            if (evt.type === "stage" && (evt as StageEvent).stage === "DONE") buildSummary = (evt as StageEvent).message;
          });
        } else if (mode === "mobile_v2") {
          await runMobileV2Pipeline(prompt, model, (evt) => {
            send(evt);
            if (evt.type === "files") generatedFiles = (evt as FilesEvent).files;
            if (evt.type === "stage" && (evt as StageEvent).stage === "DONE") buildSummary = (evt as StageEvent).message;
          });
        } else {
          // Default: code builder using orchestrator
          const safeExisting: GeneratedFile[] = existingFiles.map((f) => ({
            path: String(f.path ?? ""),
            content: String(f.content ?? ""),
            action: (["create", "update", "delete"].includes(f.action ?? "") ? f.action : "create") as
              | "create"
              | "update"
              | "delete",
          }));

          await runOrchestratorV4(
            prompt,
            safeExisting,
            null, // project memory handled client-side
            (progressEvent) => {
              const sseStage = PROGRESS_STAGE_MAP[progressEvent.stage];
              if (sseStage) {
                send({
                  type: "stage",
                  stage: sseStage,
                  message: progressEvent.message,
                  progress: progressEvent.progress,
                });
              }
            },
            model
          ).then((result) => {
            generatedFiles = result.files;
            buildSummary = result.summary;
            send({ type: "files", files: result.files });
            send({ type: "stage", stage: "DONE", message: result.summary, progress: 100 });
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Build pipeline error";
        send({ type: "error", message, details: err instanceof Error ? err.stack : undefined });
      }

      // ── Persist to Supabase (authenticated users only) ──────────────────
      if (user && token && generatedFiles.length > 0) {
        try {
          // Create project if no projectId was provided
          if (!resolvedProjectId) {
            const proj = await dbCreateProject(token, user.id, {
              title: prompt.slice(0, 80),
              mode,
              client_idea: prompt,
            });
            resolvedProjectId = proj.id;
          }

          // Upsert generated files
          await upsertProjectFiles(
            token,
            resolvedProjectId,
            generatedFiles
              .filter((f) => f.action !== "delete")
              .map((f) => ({ path: f.path, content: f.content, generated_by: model }))
          );

          // Append build record
          await appendProjectBuild(token, resolvedProjectId, buildSummary || `Build: ${prompt.slice(0, 120)}`);

          // Notify client of the persisted projectId
          send({
            type: "stage",
            stage: "DONE",
            message: buildSummary || "Build complete.",
            progress: 100,
            data: { projectId: resolvedProjectId },
          });
        } catch {
          // Persistence failure is non-fatal; build output is still usable
        }
      }

      clearInterval(heartbeat);
      try {
        controller.close();
      } catch {
        // Already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── Website V2 Pipeline ──────────────────────────────────────────────────────

async function runWebsiteV2Pipeline(
  prompt: string,
  model: string,
  send: (event: SSEEvent) => void
): Promise<void> {
  const totalPasses = MAX_POLISH_PASSES;
  let passNum = 1;

  // Notify the UI that security scanning runs in CI (not in the build pipeline)
  send({
    type: "stage",
    stage: "SECURITY_NOTE_CI",
    message: "Security scanning (Semgrep) runs automatically in CI on every PR and push to main.",
    progress: 2,
  });

  // Stage 1: Blueprint
  send({ type: "stage", stage: "BLUEPRINT", message: "Generating website blueprint…", progress: 5 });
  const plan = await generateWebsitePlan(prompt, model);
  send({
    type: "stage",
    stage: "BLUEPRINT",
    message: `Blueprint ready: "${plan.brand.name}" — ${plan.pages.length} pages`,
    progress: 15,
  });

  // Stage 1b: Generate AI logo (runs concurrently with manifest build)
  send({
    type: "stage",
    stage: "BLUEPRINT",
    message: "Generating SVG logo…",
    progress: 16,
  });

  let logoSvg: string;
  try {
    const logoResult = await generateSvgLogo({
      brandName: plan.brand.name,
      styleHints: `tone: ${plan.brand.tone}, primary color: ${plan.brand.primaryColor}, font: ${plan.brand.fontStyle}`,
      model,
    });
    logoSvg = logoResult.svg;
  } catch {
    logoSvg = getFallbackSvgLogo(plan.brand.name);
  }

  send({
    type: "stage",
    stage: "BLUEPRINT",
    message: "SVG logo ready.",
    progress: 18,
  });

  // Stage 2: Manifest
  send({ type: "stage", stage: "MANIFEST", message: "Building file manifest…", progress: 20 });
  const manifest = buildWebsiteManifest(plan, { batchSize: 5 });
  send({
    type: "stage",
    stage: "MANIFEST",
    message: `Manifest ready — ${manifest.files.length} files in ${manifest.batches.length} batches`,
    progress: 25,
  });

  // Stage 3: Pass 1 — Generate
  send({
    type: "stage",
    stage: "GENERATING",
    message: `Pass 1/${totalPasses}: Generating all files…`,
    progress: 30,
  });

  let files = await generateFromManifest(
    manifest,
    (evt) => {
      send({
        type: "stage",
        stage: "GENERATING",
        message: `Pass 1/${totalPasses}: ${evt.message}`,
        progress: 30 + Math.round(evt.progress * 0.4),
      });
    },
    model
  );

  // Ensure lib/assets.ts includes the generated logo SVG.
  // If the AI generated its own version, patch brandLogoSvg into it;
  // otherwise inject the canonical assets file with the generated logo.
  const assetsIndex = files.findIndex((f) => f.path === "lib/assets.ts");
  if (assetsIndex >= 0) {
    const existing = files[assetsIndex].content ?? "";
    if (!existing.includes("brandLogoSvg")) {
      // Prepend the brandLogoSvg export so it is always present
      files[assetsIndex] = {
        ...files[assetsIndex],
        content: `export const brandLogoSvg: string = ${JSON.stringify(logoSvg)};\n\n${existing}`,
      };
    }
  } else {
    // The AI didn't generate lib/assets.ts — inject the canonical one
    const assetsContent = buildAssetsFileContent(logoSvg, plan.brand.name, plan.brand.tagline);
    files = [{ path: "lib/assets.ts", content: assetsContent, action: "create" }, ...files];
  }

  // Ensure components/brand/Logo.tsx is present
  if (!files.some((f) => f.path === "components/brand/Logo.tsx")) {
    files = [...files, buildLogoComponentFile()];
  }

  send({ type: "files", files });

  // Stage 3b: Validate assets
  send({ type: "stage", stage: "VALIDATING", message: "Validating assets (logo + images)…", progress: 70 });
  const assetValidation = validateAssets(files);
  const assetSummary = summarizeAssetValidation(assetValidation);
  send({ type: "stage", stage: "VALIDATING", message: assetSummary, progress: 71 });

  // Auto-fix: patch Header/Footer if Logo is missing from them
  if (assetValidation.issues.some((i) => i.rule === "header-displays-logo" || i.rule === "footer-displays-logo")) {
    send({ type: "stage", stage: "FIXING", message: "FIXING ASSETS: patching Logo into Header/Footer…", progress: 72 });
    files = patchLogoIntoLayoutComponents(files);
    send({ type: "files", files });
  }

  // Stage 4: Evaluate
  send({ type: "stage", stage: "VALIDATING", message: "Evaluating UI quality…", progress: 73 });
  let evalResult = evaluateWebsiteUI(files, plan);
  send({
    type: "stage",
    stage: "VALIDATING",
    message: `Quality score: ${evalResult.score}/100 (${evalResult.issues.length} issues)`,
    progress: 75,
  });

  // Stage 5: Polish passes
  while (evalResult.score < MIN_QUALITY_SCORE && passNum < totalPasses) {
    passNum++;
    send({
      type: "stage",
      stage: "FIXING",
      message: `Pass ${passNum}/${totalPasses}: UI polish — fixing ${evalResult.issues.length} issue(s)…`,
      progress: 75 + Math.round(((passNum - 1) / (totalPasses - 1)) * 15),
    });

    const polishResult = await applyUIPolish(files, evalResult.issues, { model });
    files = polishResult.files;

    send({ type: "files", files });

    evalResult = evaluateWebsiteUI(files, plan);
    send({
      type: "stage",
      stage: "VALIDATING",
      message: `Pass ${passNum}/${totalPasses}: Quality score ${evalResult.score}/100`,
      progress: 78 + Math.round(((passNum - 1) / (totalPasses - 1)) * 12),
    });
  }

  // Stage 6: CompletenessGate — validates all required files/wiring exist
  const MAX_GATE_ATTEMPTS = 2;
  let gateAttempt = 0;
  let gateResult = runCompletenessGate(files);

  send({
    type: "stage",
    stage: "COMPLETENESS_GATE",
    message: summarizeCompletenessGate(gateResult),
    progress: 91,
  });

  while (!gateResult.passed && gateAttempt < MAX_GATE_ATTEMPTS) {
    gateAttempt++;

    send({
      type: "stage",
      stage: "COMPLETENESS_GATE_FAILED",
      message: `CompletenessGate attempt ${gateAttempt}/${MAX_GATE_ATTEMPTS} failed — ${gateResult.missingItems.length} item(s) missing. Triggering targeted remediation…`,
      progress: 92 + gateAttempt,
      data: { missingItems: gateResult.missingItems },
    });

    // Build a small remediation manifest for missing required files and re-generate them
    const missingPaths = gateResult.issues
      .filter((i) => i.severity === "error" && i.rule.startsWith("required-file:"))
      .map((i) => i.rule.replace("required-file:", ""));

    if (missingPaths.length > 0) {
      const remediationFiles = buildRemediationManifest(missingPaths, plan.brand.name, plan.brand.tagline);
      const remediationManifest = createManifest(
        `remediation-${Date.now()}`,
        `Remediation for missing files in "${plan.brand.name}"`,
        remediationFiles,
        plan,
        remediationFiles.length
      );

      send({
        type: "stage",
        stage: "FIXING",
        message: `Generating ${missingPaths.length} missing file(s): ${missingPaths.join(", ")}`,
        progress: 93 + gateAttempt,
      });

      const remediationGenerated = await generateFromManifest(
        remediationManifest,
        () => { /* silent */ },
        model
      );

      // Merge: add new files, don't overwrite existing ones
      const existingPaths = new Set(files.map((f) => f.path));
      const newFiles = remediationGenerated.filter((f) => !existingPaths.has(f.path));
      files = [...files, ...newFiles];
      send({ type: "files", files });
    }

    gateResult = runCompletenessGate(files);

    send({
      type: "stage",
      stage: "COMPLETENESS_GATE",
      message: `CompletenessGate re-check: ${summarizeCompletenessGate(gateResult)}`,
      progress: 95 + gateAttempt,
    });
  }

  const summary = `Website "${plan.brand.name}" built: ${files.length} files, quality score ${evalResult.score}/100${gateResult.passed ? "" : " ⚠ completeness issues remain"}`;
  send({ type: "stage", stage: "DONE", message: summary, progress: 100 });
}

// ─── Asset helpers ────────────────────────────────────────────────────────────

/** Build the canonical lib/assets.ts content with the generated logo. */
function buildAssetsFileContent(logoSvg: string, brandName: string, tagline: string): string {
  return `// lib/assets.ts — Stable image asset URLs and brand assets
// AUTO-GENERATED by the website build pipeline

export const brand: { name?: string; tagline?: string } = {
  name: ${JSON.stringify(brandName)},
  tagline: ${JSON.stringify(tagline)},
};

export const brandLogoSvg: string = ${JSON.stringify(logoSvg)};

export const images = {
  hero: "https://picsum.photos/id/1040/1600/900",
  features: [
    "https://picsum.photos/id/20/800/600",
    "https://picsum.photos/id/21/800/600",
    "https://picsum.photos/id/22/800/600",
    "https://picsum.photos/id/24/800/600",
    "https://picsum.photos/id/25/800/600",
    "https://picsum.photos/id/26/800/600",
  ],
  avatars: [
    "https://picsum.photos/id/64/200/200",
    "https://picsum.photos/id/65/200/200",
    "https://picsum.photos/id/91/200/200",
  ],
} as const;

export function getHeroImageUrl(seed = 0): string {
  const ids = [1040, 1041, 1043, 1044, 1046] as const;
  return \`https://picsum.photos/id/\${ids[seed % ids.length]}/1600/900\`;
}

export function getFeatureImageUrl(index: number): string {
  const ids = [20, 21, 22, 24, 25, 26] as const;
  return \`https://picsum.photos/id/\${ids[index % ids.length]}/800/600\`;
}

export function getAvatarUrl(index: number): string {
  const ids = [64, 65, 91] as const;
  return \`https://picsum.photos/id/\${ids[index % ids.length]}/200/200\`;
}
`;
}

/** Build the canonical components/brand/Logo.tsx content. */
function buildLogoComponentFile(): GeneratedFile {
  return {
    path: "components/brand/Logo.tsx",
    action: "create",
    content: `// components/brand/Logo.tsx — Brand SVG logo renderer
import { brandLogoSvg } from "@/lib/assets";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}
      aria-label="Logo"
      role="img"
      dangerouslySetInnerHTML={{ __html: brandLogoSvg }}
    />
  );
}
`,
  };
}

/**
 * Minimal auto-fix: inject a Logo import + usage into Header/Footer if missing.
 * This is a best-effort patch; the AI polish pass will clean it up further.
 */
function patchLogoIntoLayoutComponents(files: GeneratedFile[]): GeneratedFile[] {
  return files.map((file) => {
    if (
      file.path !== "components/site/Header.tsx" &&
      file.path !== "components/site/Footer.tsx"
    ) {
      return file;
    }

    const content = file.content ?? "";
    if (content.includes("Logo") || content.includes("brandLogoSvg")) {
      return file; // already present
    }

    // Inject import at the top (after any existing imports)
    const importLine = 'import Logo from "@/components/brand/Logo";\n';
    const hasImports = /^import /m.test(content);
    let patched = content;
    if (hasImports) {
      // Insert after last import line
      patched = content.replace(/(^import [^\n]+\n)(?!import )/m, `$1${importLine}`);
    } else {
      patched = importLine + content;
    }

    return { ...file, content: patched };
  });
}

/**
 * Build a small remediation manifest for a list of missing file paths.
 * Provides descriptive hints so the batch generator can create minimal stubs.
 */
function buildRemediationManifest(
  missingPaths: string[],
  brandName: string,
  tagline: string
): ManifestFile[] {
  const descriptionMap: Record<string, string> = {
    "app/page.tsx": `Home page for "${brandName}" — assembles hero, features, and CTA sections`,
    "app/about/page.tsx": `About page for "${brandName}" — company story, team, values`,
    "app/contact/page.tsx": `Contact page for "${brandName}" — contact form and location info`,
    "app/features/page.tsx": `Features page for "${brandName}" — detailed feature showcase`,
    "app/pricing/page.tsx": `Pricing page for "${brandName}" — pricing tiers with CTA`,
    "app/faq/page.tsx": `FAQ page for "${brandName}" — accordion of common questions`,
    "app/blog/page.tsx": `Blog list page: imports blogPosts from "@/lib/content/blog-posts", renders cards with coverImage, title, excerpt, date. Tagline: ${tagline}`,
    "app/blog/[slug]/page.tsx": `Blog post detail page: imports blogPosts, finds post by slug, renders cover image and content`,
    "lib/content/blog-posts.ts": `Blog post data for "${brandName}": exports BlogPost interface and blogPosts array with 3 sample posts (title, description, date, slug, author, tags, coverImage using picsum.photos)`,
    "app/(legal)/terms/page.tsx": "Terms of Service legal page with generic placeholders",
    "app/(legal)/privacy/page.tsx": "Privacy Policy legal page with GDPR/CCPA placeholders",
    "app/(legal)/cookies/page.tsx": "Cookie Policy legal page with cookie-type table",
    "app/(legal)/acceptable-use/page.tsx": "Acceptable Use Policy legal page",
    "app/(legal)/disclaimer/page.tsx": "General Disclaimer legal page",
    "lib/assets.ts": `Stable image assets: exports brand, brandLogoSvg, and images (hero 1600x900, features 800x600, avatars 200x200) using picsum.photos`,
    "components/brand/Logo.tsx": `Brand Logo: renders brandLogoSvg from lib/assets via dangerouslySetInnerHTML`,
    "components/site/Header.tsx": `Site header: imports Logo from "@/components/brand/Logo", renders nav and CTA`,
    "components/site/Footer.tsx": `Site footer: imports Logo from "@/components/brand/Logo", renders links and brand info`,
  };

  return missingPaths.map((path, i) => ({
    path,
    type: "page" as const,
    description: descriptionMap[path] ?? `Missing required file: ${path}`,
    dependencies: [],
    priority: 1 + i,
    status: "pending" as const,
    batchIndex: 0,
  }));
}

// ─── Mobile V2 Pipeline ───────────────────────────────────────────────────────

async function runMobileV2Pipeline(
  prompt: string,
  model: string,
  send: (event: SSEEvent) => void
): Promise<void> {
  const totalPasses = MAX_POLISH_PASSES;
  let passNum = 1;

  // Stage 1: Blueprint
  send({ type: "stage", stage: "BLUEPRINT", message: "Generating mobile app blueprint…", progress: 5 });
  const plan = await generateMobilePlan(prompt, model);
  send({
    type: "stage",
    stage: "BLUEPRINT",
    message: `Blueprint ready: "${plan.appName}" — ${plan.screens.length} screens`,
    progress: 15,
  });

  // Stage 2: Manifest
  send({ type: "stage", stage: "MANIFEST", message: "Building file manifest…", progress: 20 });
  const manifest = buildMobileManifest(plan, { batchSize: 5 });
  send({
    type: "stage",
    stage: "MANIFEST",
    message: `Manifest ready — ${manifest.files.length} files in ${manifest.batches.length} batches`,
    progress: 25,
  });

  // Stage 3: Pass 1 — Generate
  send({
    type: "stage",
    stage: "GENERATING",
    message: `Pass 1/${totalPasses}: Generating Expo app…`,
    progress: 30,
  });

  let files = await generateFromManifest(
    manifest,
    (evt) => {
      send({
        type: "stage",
        stage: "GENERATING",
        message: `Pass 1/${totalPasses}: ${evt.message}`,
        progress: 30 + Math.round(evt.progress * 0.4),
      });
    },
    model
  );

  send({ type: "files", files });

  // Stage 4: Evaluate
  send({ type: "stage", stage: "VALIDATING", message: "Evaluating mobile UI quality…", progress: 72 });
  let evalResult = evaluateMobileUI(files, plan);
  send({
    type: "stage",
    stage: "VALIDATING",
    message: `Quality score: ${evalResult.score}/100 (${evalResult.issues.length} issues)`,
    progress: 75,
  });

  // Stage 5: Polish passes
  while (evalResult.score < MIN_QUALITY_SCORE && passNum < totalPasses) {
    passNum++;
    send({
      type: "stage",
      stage: "FIXING",
      message: `Pass ${passNum}/${totalPasses}: UI polish — fixing ${evalResult.issues.length} issue(s)…`,
      progress: 75 + Math.round(((passNum - 1) / (totalPasses - 1)) * 15),
    });

    const polishResult = await applyUIPolish(files, evalResult.issues, { model });
    files = polishResult.files;

    send({ type: "files", files });

    evalResult = evaluateMobileUI(files, plan);
    send({
      type: "stage",
      stage: "VALIDATING",
      message: `Pass ${passNum}/${totalPasses}: Quality score ${evalResult.score}/100`,
      progress: 78 + Math.round(((passNum - 1) / (totalPasses - 1)) * 12),
    });
  }

  const summary = `Mobile app "${plan.appName}" built: ${files.length} files, quality score ${evalResult.score}/100`;
  send({ type: "stage", stage: "DONE", message: summary, progress: 100 });
}
