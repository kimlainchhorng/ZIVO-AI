// tools.ts — Tool definitions for the ZIVO AI Agent system
// Tools available: readFile, writeFile, runShell, searchDocs

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required: boolean }>;
  execute: (params: Record<string, string>) => Promise<ToolResult>;
}

export const readFileTool: Tool = {
  name: "readFile",
  description: "Read the content of a file from the virtual file system",
  parameters: {
    path: { type: "string", description: "The file path to read", required: true },
  },
  execute: async (params) => {
    const { path } = params;
    if (!path) {
      return { success: false, output: "", error: "Missing required parameter: path" };
    }
    // In the browser/agent context, this reads from a virtual file map
    return { success: true, output: `[readFile] Contents of ${path}` };
  },
};

export const writeFileTool: Tool = {
  name: "writeFile",
  description: "Write content to a file in the virtual file system",
  parameters: {
    path: { type: "string", description: "The file path to write", required: true },
    content: { type: "string", description: "The content to write to the file", required: true },
  },
  execute: async (params) => {
    const { path, content } = params;
    if (!path || content === undefined) {
      return { success: false, output: "", error: "Missing required parameters: path and content" };
    }
    return { success: true, output: `[writeFile] Wrote ${content.length} bytes to ${path}` };
  },
};

export const runShellTool: Tool = {
  name: "runShell",
  description: "Execute a shell command (sandboxed) and return stdout/stderr",
  parameters: {
    command: { type: "string", description: "The shell command to execute", required: true },
  },
  execute: async (params) => {
    const { command } = params;
    if (!command) {
      return { success: false, output: "", error: "Missing required parameter: command" };
    }
    // Placeholder — real execution happens in WebContainer or sandboxed environment
    return { success: true, output: `[runShell] Executed: ${command}` };
  },
};

export const searchDocsTool: Tool = {
  name: "searchDocs",
  description: "Search official documentation for a given technology or concept",
  parameters: {
    query: { type: "string", description: "The search query", required: true },
    technology: { type: "string", description: "The technology to search docs for (e.g. Next.js, React, Prisma)", required: false },
  },
  execute: async (params) => {
    const { query, technology } = params;
    if (!query) {
      return { success: false, output: "", error: "Missing required parameter: query" };
    }
    return {
      success: true,
      output: `[searchDocs] Search results for "${query}"${technology ? ` in ${technology} docs` : ""}`,
    };
  },
};

export const TOOLS: Tool[] = [readFileTool, writeFileTool, runShellTool, searchDocsTool];

export function getToolByName(name: string): Tool | undefined {
  return TOOLS.find((t) => t.name === name);
}

export function getToolDefinitions() {
  return TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
