import BaseAgent from "./base-agent";
import { PLATFORMS, getPlatformById, type Platform } from "../lib/platforms";
import { getIntegrationsByCategory, type Integration } from "../lib/integrations";

interface PlatformConfig {
  platformId: string;
  enabledFeatures: string[];
  enabledIntegrations: string[];
}

class PlatformAgent extends BaseAgent {
  constructor() {
    super("PlatformAgent");
  }

  getPlatform(platformId: string): Platform | undefined {
    return getPlatformById(platformId);
  }

  listPlatforms(): Platform[] {
    return PLATFORMS;
  }

  getIntegrations(category: string): Integration[] {
    return getIntegrationsByCategory(category);
  }

  buildConfig(platformId: string, enabledFeatures?: string[], enabledIntegrations?: string[]): PlatformConfig {
    const platform = getPlatformById(platformId);
    if (!platform) {
      throw new Error(`Platform "${platformId}" not found`);
    }
    const features = enabledFeatures ?? platform.features.map((f) => f.id);
    const integrations = enabledIntegrations ?? getIntegrationsByCategory(platform.integrationCategory).map((i) => i.id);
    return { platformId, enabledFeatures: features, enabledIntegrations: integrations };
  }

  generatePrompt(platformId: string): string {
    const platform = getPlatformById(platformId);
    if (!platform) {
      throw new Error(`Platform "${platformId}" not found`);
    }
    const featureList = platform.features.map((f) => `- ${f.name}: ${f.description}`).join("\n");
    const integrations = getIntegrationsByCategory(platform.integrationCategory);
    const integrationList = integrations.map((i) => `- ${i.name}: ${i.description}`).join("\n");
    return (
      `Build a ${platform.name} with the following capabilities:\n\n` +
      `Features:\n${featureList}\n\n` +
      `Supported Integrations:\n${integrationList}`
    );
  }
}

export default PlatformAgent;
