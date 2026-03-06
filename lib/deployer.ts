// lib/deployer.ts — Deployment utilities and configuration builders

export type DeployTarget = "vercel" | "netlify" | "railway" | "cloudflare-pages";

export interface DeployFile {
  path: string;
  content: string;
}

export interface VercelConfig {
  version: number;
  name: string;
  builds?: Array<{ src: string; use: string }>;
  routes?: Array<{ src: string; dest: string }>;
  env?: Record<string, string>;
}

export interface NetlifyConfig {
  build: { command: string; publish: string };
  redirects?: Array<{ from: string; to: string; status: number }>;
}

export type DeployConfig = VercelConfig | NetlifyConfig | Record<string, unknown>;

export interface DeployValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Builds the appropriate deployment configuration for the given target.
 */
export function buildDeployConfig(
  files: DeployFile[],
  target: DeployTarget
): DeployConfig {
  const paths = files.map((f) => f.path);
  const hasPackageJson = paths.some((p) => p === "package.json");
  const isNextJs = paths.some((p) => p === "next.config.ts" || p === "next.config.js");

  switch (target) {
    case "vercel": {
      const config: VercelConfig = { version: 2, name: "zivo-app" };
      if (isNextJs) {
        config.builds = [{ src: "package.json", use: "@vercel/next" }];
      } else if (hasPackageJson) {
        config.builds = [{ src: "package.json", use: "@vercel/node" }];
      }
      return config;
    }
    case "netlify": {
      const isNext = paths.some((p) => p.startsWith("app/") || p.startsWith("pages/"));
      return {
        build: {
          command: isNext ? "npm run build" : "npm run build",
          publish: isNext ? ".next" : "dist",
        },
        redirects: [{ from: "/*", to: "/index.html", status: 200 }],
      } satisfies NetlifyConfig;
    }
    case "railway":
      return {
        build: { builder: "nixpacks" },
        deploy: { startCommand: "npm start", healthcheckPath: "/api/health" },
      };
    case "cloudflare-pages":
      return {
        buildCommand: "npm run build",
        buildOutputDirectory: "out",
        compatibilityDate: new Date().toISOString().split("T")[0],
      };
    default:
      return {};
  }
}

/**
 * Validates a set of files for deployment readiness.
 */
export function validateForDeploy(files: DeployFile[]): DeployValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const paths = files.map((f) => f.path);

  if (!paths.some((p) => p === "package.json")) {
    errors.push("Missing package.json — required for deployment");
  }

  const packageFile = files.find((f) => f.path === "package.json");
  if (packageFile) {
    try {
      const pkg = JSON.parse(packageFile.content) as { scripts?: Record<string, string> };
      if (!pkg.scripts?.build && !pkg.scripts?.start) {
        warnings.push("package.json has no build or start script");
      }
    } catch {
      errors.push("package.json is not valid JSON");
    }
  }

  if (!paths.some((p) => p.endsWith(".env.example") || p.endsWith(".env"))) {
    warnings.push("No .env.example found — consider documenting required environment variables");
  }

  return { valid: errors.length === 0, errors, warnings };
}
