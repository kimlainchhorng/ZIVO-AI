export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface PluginHook {
  type: 'beforeGenerate' | 'afterGenerate' | 'onScan' | 'onBuild';
  handler: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

const plugins: Map<string, Plugin> = new Map();
const hooks: Map<string, PluginHook[]> = new Map();

export function registerPlugin(plugin: Plugin): void {
  plugins.set(plugin.id, plugin);
}

export function getPlugins(): Plugin[] {
  return Array.from(plugins.values());
}

export function enablePlugin(id: string): boolean {
  const plugin = plugins.get(id);
  if (plugin) { plugin.enabled = true; return true; }
  return false;
}

export function disablePlugin(id: string): boolean {
  const plugin = plugins.get(id);
  if (plugin) { plugin.enabled = false; return true; }
  return false;
}

export function registerHook(pluginId: string, hook: PluginHook): void {
  const existing = hooks.get(pluginId) || [];
  hooks.set(pluginId, [...existing, hook]);
}

export async function executeHooks(type: PluginHook['type'], context: Record<string, unknown>): Promise<Record<string, unknown>> {
  let result = context;
  for (const [pluginId, pluginHooks] of hooks) {
    const plugin = plugins.get(pluginId);
    if (!plugin?.enabled) continue;
    for (const hook of pluginHooks) {
      if (hook.type === type) {
        result = await hook.handler(result);
      }
    }
  }
  return result;
}

// Built-in sample plugins for the marketplace
export const SAMPLE_PLUGINS: Plugin[] = [
  { id: 'code-formatter', name: 'Code Formatter', version: '1.0.0', description: 'Auto-format generated code with Prettier', author: 'ZIVO Team', enabled: false },
  { id: 'accessibility-checker', name: 'Accessibility Checker', version: '1.2.0', description: 'Check generated HTML for accessibility issues', author: 'ZIVO Team', enabled: false },
  { id: 'seo-optimizer', name: 'SEO Optimizer', version: '1.1.0', description: 'Add meta tags and SEO best practices to generated sites', author: 'ZIVO Team', enabled: false },
  { id: 'performance-analyzer', name: 'Performance Analyzer', version: '1.0.5', description: 'Analyze and suggest performance improvements', author: 'ZIVO Team', enabled: false },
  { id: 'dark-mode-injector', name: 'Dark Mode Injector', version: '1.0.2', description: 'Automatically add dark mode support to generated sites', author: 'Community', enabled: false },
];
