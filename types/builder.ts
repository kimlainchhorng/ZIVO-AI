import { z } from 'zod';

export const StylePresetEnum = z.enum(['premium', 'minimal', 'luxury_dark', 'startup', 'corporate', 'modern_glassmorphism']);

export const SectionSchema = z.object({
  id: z.string(),
  type: z.enum(['hero', 'features', 'pricing', 'testimonials', 'faq', 'contact', 'dashboard_cards', 'login_signup', 'footer', 'navigation', 'custom']),
  title: z.string(),
  content: z.string(),
  order: z.number(),
  bgColor: z.string().optional(),
  textColor: z.string().optional(),
  spacing: z.string().optional(),
  fontSize: z.string().optional(),
  borderRadius: z.string().optional(),
});

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sections: z.array(SectionSchema),
  isHome: z.boolean().default(false),
});

export const UIOutputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  stylePreset: StylePresetEnum.optional(),
  pages: z.array(PageSchema),
  navigation: z.object({
    links: z.array(z.object({ label: z.string(), href: z.string() })),
    logo: z.string().optional(),
  }).optional(),
  footer: z.object({
    links: z.array(z.object({ label: z.string(), href: z.string() })),
    copyright: z.string().optional(),
  }).optional(),
  generatedCode: z.string().optional(),
  tailwindConfig: z.string().optional(),
});

export const ImageGenerationRequestSchema = z.object({
  prompt: z.string().min(3),
  imageType: z.enum(['logo', 'app_icon', 'hero_banner', 'social_ad', 'background_illustration', 'custom']).default('custom'),
  size: z.enum(['512x512', '1024x500', '1024x1024', '1792x1024', '1080x1920']).default('1024x1024'),
  stylePreset: StylePresetEnum.optional(),
  projectId: z.string().uuid().optional(),
});

export const ProjectVersionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  versionNumber: z.number(),
  label: z.string().optional(),
  snapshot: UIOutputSchema,
  stylePreset: StylePresetEnum.optional(),
  pages: z.array(PageSchema),
  sections: z.array(SectionSchema),
  createdAt: z.string(),
});

export const DeploymentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  provider: z.enum(['vercel', 'github']),
  deployUrl: z.string().optional(),
  githubRepo: z.string().optional(),
  githubBranch: z.string().optional(),
  status: z.enum(['pending', 'building', 'success', 'error']),
  errorMessage: z.string().optional(),
  deployedAt: z.string().optional(),
  createdAt: z.string(),
});

export type Section = z.infer<typeof SectionSchema>;
export type Page = z.infer<typeof PageSchema>;
export type UIOutput = z.infer<typeof UIOutputSchema>;
export type ImageGenerationRequest = z.infer<typeof ImageGenerationRequestSchema>;
export type ProjectVersion = z.infer<typeof ProjectVersionSchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type StylePreset = z.infer<typeof StylePresetEnum>;

export const DomainStatusEnum = z.enum(['pending_dns', 'pending_tls', 'active', 'error']);

export const ProjectDomainSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  domain: z.string(),
  status: DomainStatusEnum,
  verificationToken: z.string(),
  cnameTarget: z.string(),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MemberRoleEnum = z.enum(['owner', 'editor', 'viewer']);
export const MemberStatusEnum = z.enum(['pending', 'active', 'declined']);

export const ProjectMemberSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  role: MemberRoleEnum,
  invitedBy: z.string().uuid(),
  invitedEmail: z.string().email(),
  status: MemberStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectDomain = z.infer<typeof ProjectDomainSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type DomainStatus = z.infer<typeof DomainStatusEnum>;
export type MemberRole = z.infer<typeof MemberRoleEnum>;
export type MemberStatus = z.infer<typeof MemberStatusEnum>;
