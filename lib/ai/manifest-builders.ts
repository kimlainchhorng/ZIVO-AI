// lib/ai/manifest-builders.ts — Build ProjectManifest from WebsitePlan or MobilePlan

import type { WebsitePlan } from "./website-plan";
import type { MobilePlan } from "./mobile-plan";
import { createManifest } from "./manifest";
import type { ManifestFile, ProjectManifest } from "./manifest";

export interface ManifestBuildOpts {
  projectId?: string;
  batchSize?: number;
}

// ─── Website Manifest ─────────────────────────────────────────────────────────

/**
 * Build a ProjectManifest for a full Next.js App Router website from a WebsitePlan.
 * Always includes core pages (/, /about, /contact) and all legal pages.
 */
export function buildWebsiteManifest(
  plan: WebsitePlan,
  opts: ManifestBuildOpts = {}
): ProjectManifest {
  const projectId = opts.projectId ?? `website-${Date.now()}`;
  const batchSize = opts.batchSize ?? 5;
  const prompt = `Next.js App Router website for "${plan.brand.name}" — ${plan.brand.tagline}`;

  const files: ManifestFile[] = [];
  let priority = 1;

  // ── Config files ───────────────────────────────────────────────────────────
  files.push(
    mf("next.config.ts", "config", "Next.js configuration with image domains", [], priority++),
    mf("tailwind.config.ts", "config", "Tailwind CSS configuration extending design tokens", [], priority++),
    mf("postcss.config.mjs", "config", "PostCSS configuration for Tailwind", [], priority++),
    mf("tsconfig.json", "config", "TypeScript strict config with path aliases", [], priority++),
    mf(".env.example", "config", "Example environment variables", [], priority++)
  );

  // ── Design tokens + global styles ─────────────────────────────────────────
  files.push(
    mf("lib/design/tokens.ts", "style", "Design system tokens (colors, spacing, typography)", [], priority++),
    mf("lib/assets.ts", "util", "Single source-of-truth: exports brand, brandLogoSvg, images (hero 1600x900, features 800x600, avatars 200x200) using stable picsum.photos/id/N URLs", [], priority++),
    mf("lib/content/site-copy.ts", "util", "All site copy generated from the website plan", [], priority++),
    mf("app/globals.css", "style", "Global CSS with CSS custom properties from design tokens", [], priority++)
  );

  // ── Brand assets ───────────────────────────────────────────────────────────
  files.push(
    mf(
      "components/brand/Logo.tsx",
      "component",
      "Brand Logo component: renders brandLogoSvg from lib/assets via dangerouslySetInnerHTML. Props: size?, className?",
      ["lib/assets.ts"],
      priority++
    )
  );

  // ── Layout ─────────────────────────────────────────────────────────────────
  files.push(
    mf("app/layout.tsx", "page", "Root layout with metadata, fonts, and global providers", ["app/globals.css"], priority++),
    mf(
      "components/site/Header.tsx",
      "component",
      'Site header: MUST import Logo from "@/components/brand/Logo" and render <Logo /> beside the brand name. Also includes navigation links and CTA button.',
      ["lib/design/tokens.ts", "components/brand/Logo.tsx"],
      priority++
    ),
    mf(
      "components/site/Footer.tsx",
      "component",
      'Site footer: MUST import Logo from "@/components/brand/Logo" and render <Logo /> beside the brand name. Also includes links, legal pages, and brand info.',
      ["lib/design/tokens.ts", "components/brand/Logo.tsx"],
      priority++
    )
  );

  // ── UI primitives ──────────────────────────────────────────────────────────
  files.push(
    mf("components/ui/Button.tsx", "component", "Reusable Button with variant and size props", ["lib/design/tokens.ts"], priority++),
    mf("components/ui/Card.tsx", "component", "Card container with optional header, padding, shadow", ["lib/design/tokens.ts"], priority++),
    mf("components/ui/Input.tsx", "component", "Accessible text input with label and error state", ["lib/design/tokens.ts"], priority++),
    mf("components/ui/Badge.tsx", "component", "Badge pill with variant support", ["lib/design/tokens.ts"], priority++),
    mf("components/ui/Modal.tsx", "component", "Dialog modal with overlay and close button", ["lib/design/tokens.ts"], priority++),
    mf("components/ui/Tabs.tsx", "component", "Tabs with active state and accessible roles", ["lib/design/tokens.ts"], priority++)
  );

  // ── Section components ─────────────────────────────────────────────────────
  const sectionTypes = new Set(
    plan.pages.flatMap((p) => p.sections.map((s) => s.type))
  );

  // Descriptions that reinforce image/avatar requirements per section type
  const sectionImageHints: Partial<Record<string, string>> = {
    hero: 'MUST import `images` from "@/lib/assets" and render <img src={images.hero} alt="Hero" /> with responsive classes. Use next/image if available.',
    features: 'MUST import `images` from "@/lib/assets" and render at least 3 feature images from images.features (800x600). Use next/image if available.',
    testimonials: 'MUST import `images` from "@/lib/assets" and render avatar images from images.avatars (200x200) beside each testimonial. Use next/image if available.',
  };

  for (const sectionType of sectionTypes) {
    const name = capitalize(sectionType);
    const imageHint = sectionImageHints[sectionType] ?? "";
    const description = [
      `${name} section component using design tokens and stable assets`,
      imageHint,
    ]
      .filter(Boolean)
      .join(". ");
    files.push(
      mf(
        `components/sections/${name}Section.tsx`,
        "component",
        description,
        ["lib/assets.ts", "lib/design/tokens.ts", "components/ui/Button.tsx"],
        priority++
      )
    );
  }

  // ── App pages ──────────────────────────────────────────────────────────────
  // Ensure core pages exist regardless of plan
  const coreRoutes = ["/", "/about", "/contact"];
  const planRoutes = plan.pages.map((p) => p.route);
  const allRoutes = [...new Set([...coreRoutes, ...planRoutes])];

  for (const route of allRoutes) {
    const filePath = routeToFilePath(route);
    const planPage = plan.pages.find((p) => p.route === route);
    const title = planPage?.title ?? routeToTitle(route);
    files.push(
      mf(
        filePath,
        "page",
        `${title} page — assembles section components`,
        ["components/site/Header.tsx", "components/site/Footer.tsx"],
        priority++
      )
    );
  }

  // ── Legal pages ────────────────────────────────────────────────────────────
  const legalPages = [
    { route: "/terms", title: "Terms of Service" },
    { route: "/privacy", title: "Privacy Policy" },
    { route: "/cookies", title: "Cookie Policy" },
    { route: "/acceptable-use", title: "Acceptable Use Policy" },
    { route: "/disclaimer", title: "Disclaimer" },
  ];

  for (const { route, title } of legalPages) {
    files.push(
      mf(
        routeToFilePath(route),
        "page",
        `${title} legal page`,
        ["components/site/Header.tsx", "components/site/Footer.tsx"],
        priority++
      )
    );
  }

  // ── SEO metadata ──────────────────────────────────────────────────────────
  files.push(
    mf("app/sitemap.ts", "util", "Auto-generated sitemap for all pages", [], priority++),
    mf("app/robots.ts", "util", "Robots.txt configuration", [], priority++),
    mf("public/favicon.ico", "config", "Favicon placeholder", [], priority++)
  );

  return createManifest(projectId, prompt, files, plan, batchSize);
}

// ─── Mobile Manifest ──────────────────────────────────────────────────────────

/**
 * Build a ProjectManifest for an Expo Router React Native app from a MobilePlan.
 * All files are placed under mobile/ folder.
 */
export function buildMobileManifest(
  plan: MobilePlan,
  opts: ManifestBuildOpts = {}
): ProjectManifest {
  const projectId = opts.projectId ?? `mobile-${Date.now()}`;
  const batchSize = opts.batchSize ?? 5;
  const prompt = `Expo Router React Native app: "${plan.appName}" — ${plan.persona}`;

  const files: ManifestFile[] = [];
  let priority = 1;

  // ── Config ─────────────────────────────────────────────────────────────────
  files.push(
    mf("mobile/package.json", "config", "Expo package.json with React Native dependencies", [], priority++),
    mf("mobile/app.json", "config", "Expo app.json configuration", [], priority++),
    mf("mobile/tsconfig.json", "config", "TypeScript config for the Expo app", [], priority++),
    mf("mobile/babel.config.js", "config", "Babel configuration for Expo", [], priority++)
  );

  // ── Theme ──────────────────────────────────────────────────────────────────
  files.push(
    mf("mobile/theme/tokens.ts", "style", "Design tokens: colors, spacing, typography for mobile", [], priority++),
    mf("mobile/theme/index.ts", "style", "Theme barrel export", ["mobile/theme/tokens.ts"], priority++)
  );

  // ── Mock data ─────────────────────────────────────────────────────────────
  files.push(
    mf("mobile/lib/mock-data.ts", "util", "Mock data matching the data model entities", [], priority++)
  );

  // ── UI primitives ─────────────────────────────────────────────────────────
  const mobileUIPrimitives = ["Button", "Card", "Input", "Badge", "Avatar", "ListItem", "LoadingState", "EmptyState", "ErrorState"];
  for (const primitive of mobileUIPrimitives) {
    files.push(
      mf(
        `mobile/components/ui/${primitive}.tsx`,
        "component",
        `Mobile ${primitive} primitive using theme tokens`,
        ["mobile/theme/tokens.ts"],
        priority++
      )
    );
  }

  // ── Expo Router layout ────────────────────────────────────────────────────
  files.push(
    mf("mobile/app/_layout.tsx", "page", "Root Expo Router layout with providers and navigation", ["mobile/theme/index.ts"], priority++)
  );

  if (plan.navigation === "tabs") {
    files.push(
      mf("mobile/app/(tabs)/_layout.tsx", "page", "Tab navigator layout with tab bar configuration", ["mobile/theme/tokens.ts"], priority++)
    );
  }

  // ── Screens ────────────────────────────────────────────────────────────────
  for (const screen of plan.screens) {
    const screenPath = plan.navigation === "tabs"
      ? `mobile/app/(tabs)/${screenNameToFile(screen.name)}.tsx`
      : `mobile/app/${screenNameToFile(screen.name)}.tsx`;

    files.push(
      mf(
        screenPath,
        "page",
        `${screen.name} screen — ${screen.purpose}. States: ${screen.states.join(", ")}`,
        ["mobile/theme/tokens.ts", "mobile/lib/mock-data.ts", ...screen.components.map((c) => `mobile/components/ui/${c}.tsx`)],
        priority++
      )
    );
  }

  // ── Feature components ─────────────────────────────────────────────────────
  const allComponents = new Set(plan.screens.flatMap((s) => s.components));
  for (const component of allComponents) {
    // Skip if it's a UI primitive already created
    if (mobileUIPrimitives.includes(component)) continue;
    files.push(
      mf(
        `mobile/components/${component}.tsx`,
        "component",
        `${component} feature component`,
        ["mobile/theme/tokens.ts"],
        priority++
      )
    );
  }

  // ── README ─────────────────────────────────────────────────────────────────
  files.push(
    mf("mobile/README.md", "config", "Setup instructions: install, run on iOS/Android/web, env vars", [], priority++)
  );

  return createManifest(projectId, prompt, files, plan, batchSize);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mf(
  path: string,
  type: ManifestFile["type"],
  description: string,
  dependencies: string[],
  priority: number
): ManifestFile {
  return {
    path,
    type,
    description,
    dependencies,
    priority,
    status: "pending",
    batchIndex: 0,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function routeToFilePath(route: string): string {
  if (route === "/") return "app/page.tsx";
  // Remove leading slash, replace remaining slashes with /
  const clean = route.replace(/^\//, "");
  return `app/${clean}/page.tsx`;
}

function routeToTitle(route: string): string {
  if (route === "/") return "Home";
  const segment = route.replace(/^\//, "").replace(/-/g, " ");
  return capitalize(segment);
}

function screenNameToFile(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
