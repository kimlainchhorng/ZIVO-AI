import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const StylePresetEnum = z.enum([
  'premium',
  'minimal',
  'luxury_dark',
  'startup',
  'corporate',
  'modern_glassmorphism',
  'retro',
  'brutalist',
]);

export const SectionTypeEnum = z.enum([
  'hero',
  'features',
  'pricing',
  'testimonials',
  'faq',
  'contact',
  'dashboard_cards',
  'login_signup',
  'footer',
  'navigation',
  'custom',
  'blog',
  'team',
  'cta',
  'logos',
  'stats',
  'timeline',
]);

// ─── Section ──────────────────────────────────────────────────────────────────

export const SectionSchema = z.object({
  id: z.string().min(1),
  type: SectionTypeEnum,
  title: z.string(),
  content: z.string(),
  order: z.number().int().nonnegative(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  spacing: z.string().optional(),
  fontSize: z.string().optional(),
  borderRadius: z.string().optional(),
  subtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  visible: z.boolean().default(true),
  locked: z.boolean().default(false),
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export const PageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().regex(/^\/[a-z0-9\-\/]*$/, 'Slug must start with / and use lowercase letters, digits, or hyphens'),
  sections: z.array(SectionSchema),
  isHome: z.boolean().default(false),
  title: z.string().optional(),
  description: z.string().optional(),
  requiresAuth: z.boolean().default(false),
  order: z.number().int().nonnegative().default(0),
});

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NavLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string(),
  icon: z.string().optional(),
  external: z.boolean().default(false),
});

export const NavigationSchema = z.object({
  links: z.array(NavLinkSchema),
  logo: z.string().optional(),
  logoHref: z.string().default('/'),
  sticky: z.boolean().default(true),
});

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FooterSchema = z.object({
  links: z.array(NavLinkSchema),
  copyright: z.string().optional(),
  showSocials: z.boolean().default(false),
  socialLinks: z.array(z.object({
    platform: z.enum(['twitter', 'github', 'linkedin', 'instagram', 'youtube', 'discord']),
    href: z.string().url(),
  })).optional(),
});

// ─── UIOutput ─────────────────────────────────────────────────────────────────

export const UIOutputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  stylePreset: StylePresetEnum.optional(),
  pages: z.array(PageSchema).min(1),
  navigation: NavigationSchema.optional(),
  footer: FooterSchema.optional(),
  generatedCode: z.string().optional(),
  tailwindConfig: z.string().optional(),
  version: z.number().int().nonnegative().default(1),
  generatedAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  locale: z.string().default('en'),
  faviconUrl: z.string().url().optional(),
  customCss: z.string().optional(),
});

// ─── Image Generation ─────────────────────────────────────────────────────────

export const ImageGenerationRequestSchema = z.object({
  prompt: z.string().min(3).max(1000),
  imageType: z.enum([
    'logo',
    'app_icon',
    'hero_banner',
    'social_ad',
    'background_illustration',
    'custom',
    'og_image',
    'favicon',
  ]).default('custom'),
  size: z.enum(['256x256', '512x512', '1024x500', '1024x1024', '1792x1024', '1080x1920']).default('1024x1024'),
  stylePreset: StylePresetEnum.optional(),
  projectId: z.string().uuid().optional(),
  quality: z.enum(['standard', 'hd']).default('standard'),
  n: z.number().int().min(1).max(4).default(1),
});

// ─── Project Version ──────────────────────────────────────────────────────────

export const ProjectVersionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  versionNumber: z.number().int().nonnegative(),
  label: z.string().optional(),
  snapshot: UIOutputSchema,
  stylePreset: StylePresetEnum.optional(),
  pages: z.array(PageSchema),
  sections: z.array(SectionSchema),
  createdAt: z.string().datetime(),
  createdBy: z.string().uuid().optional(),
  changelog: z.string().optional(),
  isPublished: z.boolean().default(false),
});

// ─── Deployment ───────────────────────────────────────────────────────────────

export const DeploymentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  provider: z.enum(['vercel', 'github', 'docker', 'railway', 'netlify']),
  deployUrl: z.string().url().optional(),
  githubRepo: z.string().optional(),
  githubBranch: z.string().optional(),
  dockerEndpoint: z.string().optional(),
  commitSha: z.string().optional(),
  status: z.enum(['pending', 'building', 'success', 'error', 'cancelled']),
  errorMessage: z.string().optional(),
  deployedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative().optional(),
  triggeredBy: z.string().uuid().optional(),
});

// ─── Domain ───────────────────────────────────────────────────────────────────

export const DomainStatusEnum = z.enum(['pending_dns', 'pending_tls', 'active', 'error']);

export const ProjectDomainSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  domain: z.string().regex(/^([a-z0-9\-]+\.)+[a-z]{2,}$/, 'Invalid domain format'),
  status: DomainStatusEnum,
  verificationToken: z.string().min(1),
  cnameTarget: z.string().min(1),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isPrimary: z.boolean().default(false),
  sslExpiresAt: z.string().datetime().optional(),
});

// ─── Team / Membership ────────────────────────────────────────────────────────

export const MemberRoleEnum = z.enum(['owner', 'editor', 'viewer', 'billing']);
export const MemberStatusEnum = z.enum(['pending', 'active', 'declined', 'removed']);

export const ProjectMemberSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  role: MemberRoleEnum,
  invitedBy: z.string().uuid(),
  invitedEmail: z.string().email(),
  status: MemberStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  acceptedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

// ─── Analytics Event ─────────────────────────────────────────────────────────

export const AnalyticsEventSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  event: z.enum(['page_view', 'section_click', 'cta_click', 'form_submit', 'deploy', 'publish']),
  page: z.string().optional(),
  sectionId: z.string().optional(),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  occurredAt: z.string().datetime(),
});

// ─── AI Generation Job ────────────────────────────────────────────────────────

export const AIGenerationJobSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  type: z.enum(['website', 'schema', 'auth', 'devops', 'ui_library', 'component']),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']),
  prompt: z.string().min(1),
  model: z.string().default('gpt-4o'),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type SectionType = z.infer<typeof SectionTypeEnum>;
export type Section = z.infer<typeof SectionSchema>;
export type Page = z.infer<typeof PageSchema>;
export type NavLink = z.infer<typeof NavLinkSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type Footer = z.infer<typeof FooterSchema>;
export type UIOutput = z.infer<typeof UIOutputSchema>;
export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;
export type ProjectVersion = z.infer<typeof ProjectVersionSchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type StylePreset = z.infer<typeof StylePresetEnum>;
export type ProjectDomain = z.infer<typeof ProjectDomainSchema>;
export type DomainStatus = z.infer<typeof DomainStatusEnum>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type MemberRole = z.infer<typeof MemberRoleEnum>;
export type MemberStatus = z.infer<typeof MemberStatusEnum>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AIGenerationJob = z.infer<typeof AIGenerationJobSchema>;
