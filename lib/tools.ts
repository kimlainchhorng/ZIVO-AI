import { promises as fs } from "fs";
import path from "path";
import type { ToolDefinition } from "../agents/base-agent";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a user-supplied relative path safely inside the project root. */
function safeProjPath(relativePath: string): string {
  const cwd = process.cwd();
  const resolved = path.resolve(cwd, relativePath);
  if (!resolved.startsWith(cwd)) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Tool: read_file
// ---------------------------------------------------------------------------
export const readFileTool: ToolDefinition = {
  name: "read_file",
  description: "Read the text content of a file inside the project",
  parameters: {
    type: "object",
    properties: {
      file_path: {
        type: "string",
        description: "Relative path to the file (e.g. src/app/page.tsx)",
      },
    },
    required: ["file_path"],
  },
  async execute(args) {
    const filePath = String((args as { file_path: string }).file_path);
    const abs = safeProjPath(filePath);
    const content = await fs.readFile(abs, "utf8");
    return { file_path: filePath, content };
  },
};

// ---------------------------------------------------------------------------
// Tool: write_file
// ---------------------------------------------------------------------------
export const writeFileTool: ToolDefinition = {
  name: "write_file",
  description: "Write or overwrite a file inside the project",
  parameters: {
    type: "object",
    properties: {
      file_path: { type: "string", description: "Relative path to the file" },
      content: { type: "string", description: "Full file content to write" },
    },
    required: ["file_path", "content"],
  },
  async execute(args) {
    const { file_path, content } = args as {
      file_path: string;
      content: string;
    };
    const abs = safeProjPath(file_path);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
    return { ok: true, file_path };
  },
};

// ---------------------------------------------------------------------------
// Tool: list_files
// ---------------------------------------------------------------------------
export const listFilesTool: ToolDefinition = {
  name: "list_files",
  description: "List files in a directory inside the project",
  parameters: {
    type: "object",
    properties: {
      dir_path: {
        type: "string",
        description: "Relative directory path (defaults to project root)",
      },
    },
    required: [],
  },
  async execute(args) {
    const dirPath = String((args as { dir_path?: string }).dir_path ?? ".");
    const abs = safeProjPath(dirPath);
    const entries = await fs.readdir(abs, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      type: e.isDirectory() ? "directory" : "file",
    }));
  },
};

// ---------------------------------------------------------------------------
// Tool: diff_code
// ---------------------------------------------------------------------------
export const diffCodeTool: ToolDefinition = {
  name: "diff_code",
  description: "Produce a line-by-line diff between two code strings",
  parameters: {
    type: "object",
    properties: {
      original: { type: "string", description: "Original code" },
      modified: { type: "string", description: "Modified code" },
    },
    required: ["original", "modified"],
  },
  async execute(args) {
    const { original, modified } = args as {
      original: string;
      modified: string;
    };
    const A = original.split(/\r?\n/);
    const B = modified.split(/\r?\n/);
    const diff: { type: "same" | "add" | "del"; line: string }[] = [];
    let i = 0,
      j = 0;
    while (i < A.length || j < B.length) {
      if (i < A.length && j < B.length) {
        if (A[i] === B[j]) {
          diff.push({ type: "same", line: A[i] });
          i++;
          j++;
        } else {
          diff.push({ type: "del", line: A[i] });
          diff.push({ type: "add", line: B[j] });
          i++;
          j++;
        }
      } else if (i < A.length) {
        diff.push({ type: "del", line: A[i++] });
      } else {
        diff.push({ type: "add", line: B[j++] });
      }
    }
    return { diff };
  },
};

// ---------------------------------------------------------------------------
// Tool: analyze_code
// ---------------------------------------------------------------------------
export const analyzeCodeTool: ToolDefinition = {
  name: "analyze_code",
  description:
    "Return basic structural metrics for a code snippet (lines, functions, imports)",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string", description: "Source code to analyze" },
      language: {
        type: "string",
        description: "Programming language (e.g. typescript, python)",
      },
    },
    required: ["code"],
  },
  async execute(args) {
    const { code, language } = args as { code: string; language?: string };
    const lines = code.split(/\r?\n/).length;
    const functions = (code.match(/function\s+\w+|=>\s*\{|async\s+\w+/g) || [])
      .length;
    const imports = (code.match(/^import\s+/gm) || []).length;
    const todos = (code.match(/\/\/\s*TODO/gi) || []).length;
    return { language: language ?? "unknown", lines, functions, imports, todos };
  },
};

// ---------------------------------------------------------------------------
// Tool: generate_structure
// ---------------------------------------------------------------------------
export const generateStructureTool: ToolDefinition = {
  name: "generate_structure",
  description: "Propose a file/folder structure for a new project or feature",
  parameters: {
    type: "object",
    properties: {
      project_type: {
        type: "string",
        description:
          "e.g. nextjs-fullstack, python-api, react-component-library",
      },
      features: {
        type: "array",
        items: { type: "string" },
        description: "List of features to include",
      },
    },
    required: ["project_type"],
  },
  async execute(args) {
    const { project_type, features = [] } = args as {
      project_type: string;
      features?: string[];
    };
    // Return a representative skeleton – agents will expand this
    return {
      project_type,
      features,
      structure: [
        "src/",
        "  app/",
        "  components/",
        "  lib/",
        "  api/",
        "tests/",
        "public/",
        ".env.example",
        "README.md",
      ],
    };
  },
};

// ---------------------------------------------------------------------------
// Convenience export – all tools bundled
// ---------------------------------------------------------------------------
export const defaultTools: ToolDefinition[] = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  diffCodeTool,
  analyzeCodeTool,
  generateStructureTool,
];
