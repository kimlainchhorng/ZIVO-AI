// lib/ai/manifest-builders.ts — Build ProjectManifest from WebsitePlan or MobilePlan

import type { WebsitePlan } from "./website-plan";
import type { MobilePlan } from "./mobile-plan";
import { createManifest } from "./manifest";
import type { ManifestFile, ProjectManifest } from "./manifest";
import type { NewFileSpec } from "./website-change-planner";

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
    mf(
      "lib/content/seo-metadata.ts",
      "util",
      `Per-page SEO metadata for "${plan.brand.name}". Export a \`seoMetadata\` record keyed by route path. Each entry: title (brand suffix), description (150 chars), openGraph { title, description, images: [{ url: '/og.svg', width: 1200, height: 630, alt }] }, twitter { card: 'summary_large_image', title, description }. Routes: /, /app, /pricing, /features, /about, /contact, /faq, /privacy, /terms.`,
      [],
      priority++
    ),
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

  // ── Blog content data ─────────────────────────────────────────────────────
  files.push(
    mf(
      "lib/content/blog-posts.ts",
      "util",
      'Blog post data: exports BlogPost interface and blogPosts array (min 3 posts) with title, description, date, slug, author, tags, and coverImage (use direct picsum.photos/id/N URLs — do NOT import from lib/assets). Must export: interface BlogPost { title: string; description: string; date: string; slug: string; author: string; tags: string[]; coverImage: string; }, const blogPosts: BlogPost[].',
      ["lib/assets.ts"],
      priority++
    )
  );

  // ── App pages ──────────────────────────────────────────────────────────────
  // Ensure all required SaaS routes exist regardless of plan
  const coreRoutes = ["/", "/app", "/about", "/contact", "/pricing", "/features", "/faq"];
  const planRoutes = plan.pages.map((p) => p.route);
  const allRoutes = [...new Set([...coreRoutes, ...planRoutes])];

  for (const route of allRoutes) {
    const filePath = routeToFilePath(route);
    const planPage = plan.pages.find((p) => p.route === route);
    const title = planPage?.title ?? routeToTitle(route);
    const desc = contentBlueprintDescription(route, plan.brand.name, plan.brand.tagline, plan.brand.tone, title);
    files.push(
      mf(
        filePath,
        "page",
        desc,
        ["components/site/Header.tsx", "components/site/Footer.tsx", "lib/content/seo-metadata.ts"],
        priority++
      )
    );
  }

  // ── Blog pages (always generated) ─────────────────────────────────────────
  files.push(
    mf(
      "app/blog/page.tsx",
      "page",
      'Blog list page: imports blogPosts from "@/lib/content/blog-posts". Renders a grid of BlogCard components, each showing cover image (use coverImage field), title, excerpt, date, author, and a "Read more" link to /blog/[slug]. Use next/image for images.',
      ["lib/content/blog-posts.ts", "lib/assets.ts", "components/site/Header.tsx", "components/site/Footer.tsx"],
      priority++
    ),
    mf(
      "app/blog/[slug]/page.tsx",
      "page",
      "Blog post detail page: uses generateStaticParams to pre-render all slugs. Imports blogPosts to look up the post by slug. Renders cover image at full width (next/image), post metadata (title, date, author, tags), and content sections. Falls back to 404 if slug not found.",
      ["lib/content/blog-posts.ts", "lib/assets.ts", "components/site/Header.tsx", "components/site/Footer.tsx"],
      priority++
    )
  );

  // ── Legal pages ────────────────────────────────────────────────────────────
  const legalPages = [
    {
      file: "app/(legal)/terms/page.tsx",
      title: "Terms of Service",
      desc: `Terms of Service legal page for "[Company Name]" (placeholder). Sections: 1) Acceptance of Terms, 2) Description of Services, 3) User Accounts, 4) Payment Terms, 5) Intellectual Property, 6) Termination, 7) Limitation of Liability, 8) Governing Law, 9) Contact Information. Use placeholders: "[Company Name]", "[Contact Email]", "[Effective Date]", "[Jurisdiction]". Full boilerplate — no jurisdiction-specific legal advice. Export Next.js page with metadata title="Terms of Service | [Company Name]". Import Header/Footer.`,
    },
    {
      file: "app/(legal)/privacy/page.tsx",
      title: "Privacy Policy",
      desc: `Privacy Policy legal page for "[Company Name]". Sections: 1) Introduction, 2) Information We Collect (personal, usage, cookies), 3) How We Use Information, 4) Data Sharing & Third Parties, 5) Data Retention, 6) Your Rights (GDPR/CCPA), 7) Security Measures, 8) Children's Privacy, 9) Changes to This Policy, 10) Contact. Use placeholders: "[Company Name]", "[DPO Email]", "[Data Retention Period]". Export Next.js page with metadata. Import Header/Footer.`,
    },
    {
      file: "app/(legal)/cookies/page.tsx",
      title: "Cookie Policy",
      desc: `Cookie Policy legal page for "[Company Name]". Include: what cookies are, types table (Essential/Functional/Analytics/Marketing), list of third-party cookies, how to manage/disable cookies. Use placeholders. Export Next.js page. Import Header/Footer.`,
    },
    {
      file: "app/(legal)/acceptable-use/page.tsx",
      title: "Acceptable Use Policy",
      desc: `Acceptable Use Policy legal page for "[Company Name]". Covers: prohibited activities (spam, illegal content, abuse, reverse engineering), enforcement, reporting violations. Use placeholders. Export Next.js page. Import Header/Footer.`,
    },
    {
      file: "app/(legal)/disclaimer/page.tsx",
      title: "Disclaimer",
      desc: `General Disclaimer legal page for "[Company Name]". Covers: no warranty, accuracy of information, external links, limitation of liability. Use placeholders. Export Next.js page. Import Header/Footer.`,
    },
  ];

  for (const { file, desc } of legalPages) {
    files.push(
      mf(
        file,
        "page",
        desc,
        ["components/site/Header.tsx", "components/site/Footer.tsx"],
        priority++
      )
    );
  }

  // ── SEO metadata ──────────────────────────────────────────────────────────
  files.push(
    mf(
      "app/sitemap.ts",
      "util",
      `Auto-generated sitemap for "${plan.brand.name}". Export default async function sitemap() returning MetadataRoute.Sitemap. Include all routes: /, /app, /pricing, /features, /about, /contact, /faq, /blog, /privacy, /terms, /cookies, /acceptable-use, /disclaimer. Use NEXT_PUBLIC_SITE_URL env var (fallback 'https://example.com'). lastModified: new Date(). changeFrequency and priority per route type.`,
      [],
      priority++
    ),
    mf(
      "app/robots.ts",
      "util",
      `robots.txt configuration for "${plan.brand.name}". Export default function robots() returning MetadataRoute.Robots. Allow all, sitemap at NEXT_PUBLIC_SITE_URL/sitemap.xml. Disallow /api/, /admin/.`,
      [],
      priority++
    ),
    mf("public/favicon.svg", "config", "Placeholder SVG favicon — replace with branded favicon", [], priority++),
    mf("app/icon.svg", "config", "Next.js SVG icon file — used as favicon by the App Router", [], priority++)
  );

  return createManifest(projectId, prompt, files, plan, batchSize);
}

// ─── Targeted Manifest (Selective Regeneration) ───────────────────────────────

/** Descriptions for well-known wiring files — used when auto-including them. */
const WIRING_FILE_DESCRIPTIONS: Record<string, string> = {
  "components/site/Header.tsx":
    'Site header: MUST import Logo from "@/components/brand/Logo" and render <Logo /> beside the brand name. Also includes navigation links and CTA button.',
  "components/site/Footer.tsx":
    'Site footer: MUST import Logo from "@/components/brand/Logo" and render <Logo /> beside the brand name. Also includes links, legal pages, and brand info.',
  "app/layout.tsx": "Root layout with metadata, fonts, and global providers",
};

/**
 * Paths that are always added when any route-level file is touched,
 * to ensure navigation wiring stays consistent.
 */
const WIRING_FILES = Object.keys(WIRING_FILE_DESCRIPTIONS);

/**
 * Build a targeted ProjectManifest that covers only the files that need
 * regenerating during a "Continue Build" / selective-regen pass.
 *
 * @param plan         The current WebsitePlan (for context passed to generator).
 * @param touchedPaths Existing file paths identified by the change planner.
 * @param newFiles     New files the planner wants to create.
 * @param opts         Optional batchSize / projectId overrides.
 */
export function buildTargetedManifest(
  plan: WebsitePlan,
  touchedPaths: string[],
  newFiles: NewFileSpec[],
  opts: ManifestBuildOpts = {}
): ProjectManifest {
  const projectId = opts.projectId ?? `selective-${Date.now()}`;
  const batchSize = opts.batchSize ?? 5;

  const allPaths = new Set<string>([...touchedPaths, ...newFiles.map((f) => f.path)]);

  // Auto-add wiring files when any page/route-level file is touched and wiring
  // files are not already in the set — keeps navigation consistent.
  const hasRouteLevelChange = [...allPaths].some(
    (p) => p.startsWith("app/") && p.endsWith("page.tsx")
  );
  if (hasRouteLevelChange) {
    for (const wf of WIRING_FILES) {
      allPaths.add(wf);
    }
  }

  const files: ManifestFile[] = [];
  let priority = 1;

  // Add touched (existing) files
  for (const path of touchedPaths) {
    const description =
      WIRING_FILE_DESCRIPTIONS[path] ??
      `Update ${path} as requested`;
    files.push(mf(path, inferType(path), description, [], priority++));
  }

  // Add wiring files that were auto-included (not already in touchedPaths)
  if (hasRouteLevelChange) {
    for (const wf of WIRING_FILES) {
      if (!touchedPaths.includes(wf) && !newFiles.some((f) => f.path === wf)) {
        files.push(
          mf(wf, "component", WIRING_FILE_DESCRIPTIONS[wf], [], priority++)
        );
      }
    }
  }

  // Add new files from the plan
  for (const nf of newFiles) {
    files.push(mf(nf.path, inferType(nf.path), nf.description, [], priority++));
  }

  const prompt = `Selective update for "${plan.brand.name}" — ${plan.brand.tagline}`;
  return createManifest(projectId, prompt, files, plan, batchSize);
}

/** Infer a ManifestFile type from its path. */
function inferType(path: string): ManifestFile["type"] {
  if (path.endsWith("page.tsx") || path.endsWith("layout.tsx")) return "page";
  if (path.startsWith("components/")) return "component";
  if (path.startsWith("app/api/")) return "api";
  if (path.startsWith("lib/")) return "util";
  if (
    path.endsWith(".css") ||
    path.endsWith("tokens.ts") ||
    path.endsWith("globals.css")
  )
    return "style";
  if (
    path.endsWith(".json") ||
    path.endsWith(".ts") && path.includes("config") ||
    path.endsWith(".mjs") ||
    path.endsWith(".ico")
  )
    return "config";
  return "util";
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

/**
 * Returns a detailed content blueprint description for a given route.
 * Used as the generator prompt hint so that each page is feature-complete.
 */
function contentBlueprintDescription(
  route: string,
  brandName: string,
  tagline: string,
  tone: string,
  title: string
): string {
  const brand = brandName || "Your Brand";
  const sub = tagline || "Your tagline";

  const blueprints: Record<string, string> = {
    "/": `Home page for "${brand}" — ${sub}. Sections: 1) Hero with bold headline ("${sub}"), animated subheading, primary CTA ("Get Started") + secondary CTA ("Learn More"), hero illustration from public/illustrations/hero.svg; 2) Logo strip (trust logos placeholder); 3) Features grid — 3-column, 6 cards each with icon from public/icons/ and 2-line description; 4) How It Works — 3 numbered steps; 5) Testimonials — 3 cards with avatars (images.avatars); 6) Pricing preview — 3 tiers teaser with CTA to /pricing; 7) FAQ preview — 3 questions accordion with link to /faq; 8) CTA banner — gradient background, headline, sign-up button. Include page-level metadata from lib/content/seo-metadata.ts. Tone: ${tone}.`,

    "/app": `App dashboard entry page for "${brand}" — authenticated SaaS user dashboard. Layout: left sidebar nav (Dashboard, Analytics, Settings, Team, Billing), main content area. Content: 1) Welcome banner ("Welcome back!"); 2) Stats row — 4 KPI cards (Active Users, Revenue, Uptime %, New Signups) each with trend arrow; 3) Quick Actions — 3 CTA buttons (Create Project, Invite Team, View Docs); 4) Recent Activity feed — 5 placeholder activity items with timestamps; 5) Usage chart placeholder (bar chart outline). Include skeleton loading states. Link back to marketing site. Include page metadata. Tone: ${tone}.`,

    "/pricing": `Pricing page for "${brand}". Sections: 1) Header — "Simple, transparent pricing" with monthly/yearly toggle (yearly = 20% off badge); 2) 3 pricing cards: Free ($0/mo, 5 features, CTA "Get Started"), Pro ($29/mo, 10 features, "Most Popular" badge, CTA "Start Free Trial"), Enterprise (Custom/contact, unlimited + SLA, CTA "Contact Sales"); each card lists feature bullets with check icons; 3) Feature comparison table — side-by-side comparison rows for all 3 tiers; 4) FAQ section — 5 pricing questions in accordion; 5) Trust strip — "Loved by X+ teams", logos; 6) CTA banner. Import illustration from public/illustrations/pricing.svg. Include metadata from seo-metadata.ts. Tone: ${tone}.`,

    "/features": `Features page for "${brand}" — ${sub}. Sections: 1) Hero — "Everything you need to ${sub.toLowerCase()}" with subheading and CTA; 2) Feature grid — 6 cards, each with icon (from public/icons/), title, 2-sentence description (analytics, team, security, api, performance, integration); 3) Detailed feature section 1 — left image + right text block with bullet list; 4) Detailed feature section 2 — right image + left text block (reversed); 5) Detailed feature section 3 — centered with full-width illustration from public/illustrations/features.svg; 6) CTA. Use icons from public/icons/ directory. Include metadata. Tone: ${tone}.`,

    "/about": `About page for "${brand}". Sections: 1) Hero — "Our mission: ${sub}" with founding story intro paragraph; 2) Mission & Values — 4 value cards (Innovation, Transparency, Customer Focus, Quality) each with icon and 2-sentence description; 3) Team section — "Meet the team" grid with 3 placeholder team member cards (name, role, avatar from images.avatars, bio 2 lines); 4) Company timeline — 4 milestones (Founded, First Customer, $Xm ARR, Present); 5) Stats row — 4 numbers (Customers, Countries, Uptime %, Team Size); 6) Join the team CTA linking to /contact. Include metadata. Tone: ${tone}.`,

    "/contact": `Contact page for "${brand}". Sections: 1) Hero — "Get in touch" with subheading; 2) Two-column layout: Left — contact form (Name, Email, Company, Subject select [Sales/Support/Partnership/Other], Message textarea, Submit button with loading state, success/error feedback); Right — contact info (email address placeholder, office hours, LinkedIn/Twitter links, support response time badge); 3) Alternative contact cards (Sales, Support, Partnerships) with email and description; 4) FAQ link CTA. Full form validation (required fields, email format). Include metadata. Tone: ${tone}.`,

    "/faq": `FAQ page for "${brand}". Sections: 1) Hero — "Frequently Asked Questions" with search bar; 2) Accordion FAQ — 12 questions across 4 categories: Getting Started (1-3): "How do I create an account?", "Is there a free trial?", "What happens after the trial?"; Features (4-6): "Can I integrate with [tool]?", "How secure is my data?", "Does it support team collaboration?"; Billing (7-9): "How does billing work?", "Can I change my plan?", "Do you offer refunds?"; Support (10-12): "How do I get help?", "What is your SLA?", "How do I cancel?". Each answer is 2-3 sentences. Smooth accordion animation. 3) "Still have questions?" CTA to contact page. Include metadata. Tone: ${tone}.`,
  };

  return blueprints[route] ?? `${title} page — assembles section components for "${brand}". Tone: ${tone}.`;
}

function screenNameToFile(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
