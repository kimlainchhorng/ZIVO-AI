export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  tags: string[];
}

export const FLAG_AI_SWARM_MODE = "ai-swarm-mode";
export const FLAG_VISUAL_BUILDER = "visual-builder";
export const FLAG_COLLABORATION = "collaboration";
export const FLAG_PLUGIN_MARKETPLACE = "plugin-marketplace";
export const FLAG_ADVANCED_DEPLOY = "advanced-deploy";
export const FLAG_SEO_ANALYZER = "seo-analyzer";
export const FLAG_A11Y_SCANNER = "a11y-scanner";
export const FLAG_DOC_GENERATOR = "doc-generator";

export const FEATURE_FLAGS: FeatureFlag[] = [
  { id: FLAG_AI_SWARM_MODE, name: "AI Swarm Mode", description: "Enable multi-agent parallel code generation", enabled: false, rolloutPercentage: 0, tags: ["ai", "experimental"] },
  { id: FLAG_VISUAL_BUILDER, name: "Visual Builder", description: "Drag-and-drop visual component builder", enabled: true, rolloutPercentage: 100, tags: ["ui"] },
  { id: FLAG_COLLABORATION, name: "Real-time Collaboration", description: "Multi-user live collaboration on projects", enabled: false, rolloutPercentage: 20, tags: ["collaboration", "experimental"] },
  { id: FLAG_PLUGIN_MARKETPLACE, name: "Plugin Marketplace", description: "Browse and install third-party plugins", enabled: true, rolloutPercentage: 100, tags: ["plugins"] },
  { id: FLAG_ADVANCED_DEPLOY, name: "Advanced Deploy", description: "Blue-green and canary deployment strategies", enabled: true, rolloutPercentage: 100, tags: ["deploy"] },
  { id: FLAG_SEO_ANALYZER, name: "SEO Analyzer", description: "Automated SEO analysis and recommendations", enabled: true, rolloutPercentage: 100, tags: ["seo"] },
  { id: FLAG_A11Y_SCANNER, name: "Accessibility Scanner", description: "WCAG compliance scanning", enabled: true, rolloutPercentage: 100, tags: ["a11y"] },
  { id: FLAG_DOC_GENERATOR, name: "Doc Generator", description: "AI-powered documentation generation", enabled: true, rolloutPercentage: 100, tags: ["docs"] },
];

// In-memory overrides (resets on restart)
const overrides: Map<string, boolean> = new Map();

export function isEnabled(flagId: string): boolean {
  if (overrides.has(flagId)) return overrides.get(flagId)!;
  const flag = FEATURE_FLAGS.find((f) => f.id === flagId);
  return flag?.enabled ?? false;
}

export function getEnabledFlags(): FeatureFlag[] {
  return FEATURE_FLAGS.filter((f) => isEnabled(f.id));
}

export function setFlag(flagId: string, enabled: boolean): void {
  overrides.set(flagId, enabled);
}
