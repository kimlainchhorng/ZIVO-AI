/**
 * lib/knowledge-indexer.ts
 *
 * Extracts structured metadata from a Next.js / React project's files.
 * All extraction is best-effort and designed to be fast and safe.
 *
 * Extraction covers:
 *  - Framework and dependency versions (package.json)
 *  - Routes (app router: app/page.*, pages router: pages/*.tsx)
 *  - API endpoints (app/api/route.*, pages/api)
 *  - Referenced environment variables (process.env.* / NEXT_PUBLIC_*)
 *  - Component map (files under components/ with first-level imports)
 */

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Max bytes to read from a single file before truncating. */
const MAX_FILE_BYTES = 100_000;

/** Max number of files to scan for env-var extraction. */
const MAX_ENV_SCAN_FILES = 200;

/** Max number of component files to include in the map. */
const MAX_COMPONENT_MAP_FILES = 50;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FrameworkInfo {
  name: string;
  version: string | null;
}

export interface ComponentEntry {
  path: string;
  imports: string[];
}

export interface KnowledgeJson {
  /** Detected frameworks and key dependencies with versions */
  frameworks: FrameworkInfo[];
  /** Primary runtime (e.g. "nextjs", "react", "unknown") */
  runtime: string;
  /** App/pages routes */
  routes: string[];
  /** API endpoint paths */
  apiEndpoints: string[];
  /** Unique env-var names referenced in source files */
  envVars: string[];
  /** Best-effort component map */
  componentMap: ComponentEntry[];
  /** Summary of latest quality/build outcome if available */
  buildSummary: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Truncate file content so we don't process giant files. */
function truncate(content: string): string {
  if (content.length <= MAX_FILE_BYTES) return content;
  return content.slice(0, MAX_FILE_BYTES);
}

/** Extract dependencies block from package.json content. */
function parseDependencies(content: string): Record<string, string> {
  try {
    const pkg = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  } catch {
    return {};
  }
}

/** Detect frameworks from the dependency map. */
function detectFrameworks(deps: Record<string, string>): { frameworks: FrameworkInfo[]; runtime: string } {
  const interest: Array<[string, string]> = [
    ["next", "nextjs"],
    ["react", "react"],
    ["react-dom", "react"],
    ["vue", "vue"],
    ["svelte", "svelte"],
    ["nuxt", "nuxt"],
    ["@remix-run/react", "remix"],
    ["astro", "astro"],
    ["tailwindcss", "tailwindcss"],
    ["typescript", "typescript"],
    ["@types/react", "react"],
  ];

  const seen = new Set<string>();
  const frameworks: FrameworkInfo[] = [];

  for (const [pkg, label] of interest) {
    if (deps[pkg] !== undefined && !seen.has(label)) {
      seen.add(label);
      frameworks.push({ name: label, version: deps[pkg] ?? null });
    }
  }

  let runtime = "unknown";
  if (seen.has("nextjs")) runtime = "nextjs";
  else if (seen.has("nuxt")) runtime = "nuxt";
  else if (seen.has("remix")) runtime = "remix";
  else if (seen.has("astro")) runtime = "astro";
  else if (seen.has("react")) runtime = "react";
  else if (seen.has("vue")) runtime = "vue";
  else if (seen.has("svelte")) runtime = "svelte";

  return { frameworks, runtime };
}

/** Determine if a file path is a Next.js route (app router). */
function isAppRoute(path: string): boolean {
  return /^app\/.*\/page\.[jt]sx?$/.test(path) || /^app\/page\.[jt]sx?$/.test(path);
}

/** Determine if a file path is a Next.js route (pages router). */
function isPagesRoute(path: string): boolean {
  return (
    /^pages\/(?!api\/).*\.[jt]sx?$/.test(path) &&
    !path.endsWith("_app.tsx") &&
    !path.endsWith("_app.ts") &&
    !path.endsWith("_app.jsx") &&
    !path.endsWith("_app.js") &&
    !path.endsWith("_document.tsx") &&
    !path.endsWith("_document.ts") &&
    !path.endsWith("_document.jsx") &&
    !path.endsWith("_document.js")
  );
}

/** Determine if a file path is an API endpoint. */
function isApiEndpoint(path: string): boolean {
  return (
    /^app\/api\/.*\/route\.[jt]sx?$/.test(path) ||
    /^pages\/api\/.*\.[jt]sx?$/.test(path)
  );
}

/** Convert a file path to a human-readable route slug. */
function fileToRoute(path: string): string {
  let route: string;

  if (path.startsWith("app/")) {
    // App router: app/about/page.tsx -> /about, app/api/users/route.ts -> /api/users
    route = path
      .replace(/^app/, "")
      .replace(/\/page\.[jt]sx?$/, "")
      .replace(/\/route\.[jt]sx?$/, "")
      || "/";
  } else if (path.startsWith("pages/")) {
    // Pages router: pages/about.tsx -> /about, pages/api/users.ts -> /api/users
    route = path
      .replace(/^pages/, "")
      .replace(/\/index\.[jt]sx?$/, "")
      .replace(/\.[jt]sx?$/, "")
      || "/";
  } else {
    route = "/" + path.replace(/\.[jt]sx?$/, "");
  }

  // Dynamic segments: [id] -> :id
  route = route.replace(/\[([^\]]+)\]/g, ":$1");

  return route || "/";
}

/** Extract referenced env-var names from source text. */
function extractEnvVars(content: string): string[] {
  const found = new Set<string>();

  // process.env.SOME_VAR
  const processEnvRe = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = processEnvRe.exec(content)) !== null) {
    found.add(m[1]);
  }

  // NEXT_PUBLIC_ vars referenced as string literals or template literals
  const nextPublicRe = /\bNEXT_PUBLIC_[A-Z0-9_]+\b/g;
  while ((m = nextPublicRe.exec(content)) !== null) {
    found.add(m[0]);
  }

  return Array.from(found);
}

/** Extract first-level import paths from a JS/TS file. */
function extractImports(content: string): string[] {
  const found = new Set<string>();
  const importRe = /^\s*import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/gm;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(content)) !== null) {
    const imp = m[1];
    // Only include local/relative imports and @/ aliases
    if (imp.startsWith(".") || imp.startsWith("@/")) {
      found.add(imp);
    }
  }
  return Array.from(found);
}

// ─── Main export ───────────────────────────────────────────────────────────────

export interface IndexerFile {
  path: string;
  content: string;
}

/**
 * Runs the knowledge indexer over the provided file list.
 *
 * @param files - Array of project files (path + content).
 * @param buildSummary - Optional summary from the latest quality/build run.
 * @returns Structured KnowledgeJson record.
 */
export function indexProjectFiles(
  files: IndexerFile[],
  buildSummary: string | null = null
): KnowledgeJson {
  // ── 1. Find package.json and detect frameworks ──────────────────────────────
  const pkgFile = files.find(
    (f) => f.path === "package.json" || f.path.endsWith("/package.json")
  );
  const deps = pkgFile ? parseDependencies(truncate(pkgFile.content)) : {};
  const { frameworks, runtime } = detectFrameworks(deps);

  // ── 2. Routes ───────────────────────────────────────────────────────────────
  const routes: string[] = [];
  const apiEndpoints: string[] = [];

  for (const f of files) {
    if (isApiEndpoint(f.path)) {
      apiEndpoints.push(fileToRoute(f.path));
    } else if (isAppRoute(f.path) || isPagesRoute(f.path)) {
      routes.push(fileToRoute(f.path));
    }
  }

  // ── 3. Env vars ─────────────────────────────────────────────────────────────
  const envVarSet = new Set<string>();
  let scanned = 0;
  for (const f of files) {
    if (scanned >= MAX_ENV_SCAN_FILES) break;
    if (!/\.[jt]sx?$/.test(f.path) && !f.path.endsWith(".env") && !f.path.endsWith(".env.local")) {
      continue;
    }
    for (const v of extractEnvVars(truncate(f.content))) {
      envVarSet.add(v);
    }
    scanned++;
  }

  // ── 4. Component map ────────────────────────────────────────────────────────
  const componentFiles = files.filter(
    (f) =>
      /^components\//i.test(f.path) &&
      /\.[jt]sx?$/.test(f.path)
  );

  const componentMap: ComponentEntry[] = componentFiles
    .slice(0, MAX_COMPONENT_MAP_FILES)
    .map((f) => ({
      path: f.path,
      imports: extractImports(truncate(f.content)),
    }));

  return {
    frameworks,
    runtime,
    routes: [...new Set(routes)].sort(),
    apiEndpoints: [...new Set(apiEndpoints)].sort(),
    envVars: [...envVarSet].sort(),
    componentMap,
    buildSummary,
  };
}
