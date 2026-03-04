// lib/plugins/types.ts — Plugin architecture type definitions for ZIVO AI

export interface GeneratedFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface NextApiRoute {
  path: string;
  methods: Array<"GET" | "POST" | "PUT" | "PATCH" | "DELETE">;
  description?: string;
}

export interface ZivoPluginHooks {
  /** Transform the prompt before AI generation */
  beforeGenerate?: (prompt: string) => string;
  /** Post-process generated files */
  afterGenerate?: (files: GeneratedFile[]) => GeneratedFile[];
  /** Handle errors during generation */
  onError?: (error: Error) => void;
}

export interface ZivoPlugin {
  /** Unique plugin identifier */
  name: string;
  /** Semver version string */
  version: string;
  /** Human-readable description */
  description: string;
  /** Lifecycle hooks */
  hooks: ZivoPluginHooks;
  /** Additional API routes provided by this plugin */
  routes?: NextApiRoute[];
}

export interface PluginRegistry {
  plugins: ZivoPlugin[];
  register: (plugin: ZivoPlugin) => void;
  unregister: (name: string) => void;
  get: (name: string) => ZivoPlugin | undefined;
  runBeforeGenerate: (prompt: string) => string;
  runAfterGenerate: (files: GeneratedFile[]) => GeneratedFile[];
}

/** Create a plugin registry that manages and runs hooks */
export function createPluginRegistry(
  initialPlugins: ZivoPlugin[] = []
): PluginRegistry {
  const plugins: ZivoPlugin[] = [...initialPlugins];

  return {
    plugins,
    register(plugin) {
      const existing = plugins.findIndex((p) => p.name === plugin.name);
      if (existing >= 0) {
        plugins[existing] = plugin;
      } else {
        plugins.push(plugin);
      }
    },
    unregister(name) {
      const idx = plugins.findIndex((p) => p.name === name);
      if (idx >= 0) plugins.splice(idx, 1);
    },
    get(name) {
      return plugins.find((p) => p.name === name);
    },
    runBeforeGenerate(prompt) {
      return plugins.reduce(
        (acc, plugin) =>
          plugin.hooks.beforeGenerate ? plugin.hooks.beforeGenerate(acc) : acc,
        prompt
      );
    },
    runAfterGenerate(files) {
      return plugins.reduce(
        (acc, plugin) =>
          plugin.hooks.afterGenerate ? plugin.hooks.afterGenerate(acc) : acc,
        files
      );
    },
  };
}
