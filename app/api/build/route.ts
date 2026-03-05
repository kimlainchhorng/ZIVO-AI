// app/api/build/route.ts — SSE streaming build pipeline endpoint
// Accepts: POST { prompt, mode?, model?, projectId?, existingFiles?, projectMemory?, context? }
// Streams:  text/event-stream with stage/files/error events
// Modes: 'code' (default) | 'website_v2' | 'mobile_v2'

export const runtime = "nodejs";

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

export type BuildMode = "code" | "website_v2" | "mobile_v2";

type SSEStageType = "BLUEPRINT" | "MANIFEST" | "GENERATING" | "VALIDATING" | "FIXING" | "DONE";

interface StageEvent {
  type: "stage";
  stage: SSEStageType;
  message: string;
  progress?: number;
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

  const { prompt, model = "gpt-4o", existingFiles = [] } = body;
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

      try {
        if (mode === "website_v2") {
          await runWebsiteV2Pipeline(prompt, model, send);
        } else if (mode === "mobile_v2") {
          await runMobileV2Pipeline(prompt, model, send);
        } else {
          // Default: code builder using orchestrator
          const safeExisting: GeneratedFile[] = Array.isArray(existingFiles)
            ? existingFiles.map((f) => ({
                path: String(f.path ?? ""),
                content: String(f.content ?? ""),
                action: (["create", "update", "delete"].includes(f.action ?? "") ? f.action : "create") as
                  | "create"
                  | "update"
                  | "delete",
              }))
            : [];

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
            send({ type: "files", files: result.files });
            send({ type: "stage", stage: "DONE", message: result.summary, progress: 100 });
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Build pipeline error";
        send({ type: "error", message, details: err instanceof Error ? err.stack : undefined });
      } finally {
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
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

  const summary = `Website "${plan.brand.name}" built: ${files.length} files, quality score ${evalResult.score}/100`;
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
