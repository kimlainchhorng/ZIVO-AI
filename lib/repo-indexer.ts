// lib/repo-indexer.ts — In-memory repository indexer

export interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
  language?: string;
}

export interface SymbolEntry {
  name: string;
  type: "function" | "class" | "interface" | "type" | "variable" | "export";
  file: string;
  line: number;
}

export interface RepoIndex {
  symbols: Map<string, SymbolEntry>;
  imports: Map<string, string[]>;
  exports: Map<string, string[]>;
  files: Map<string, string>;
}

export interface SearchResult {
  file: string;
  line: number;
  snippet: string;
  score: number;
}

export interface FileGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string }>;
}

/**
 * Extracts symbol names from TypeScript/JavaScript source code.
 */
function extractSymbols(content: string, filePath: string): SymbolEntry[] {
  const symbols: SymbolEntry[] = [];
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    const lineNo = i + 1;
    // Functions
    const fnMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (fnMatch) symbols.push({ name: fnMatch[1], type: "function", file: filePath, line: lineNo });
    // Arrow functions / const
    const arrowMatch = line.match(/(?:export\s+)?const\s+(\w+)\s*(?::\s*\S+\s*)?=\s*(?:async\s+)?\(/);
    if (arrowMatch) symbols.push({ name: arrowMatch[1], type: "function", file: filePath, line: lineNo });
    // Classes
    const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
    if (classMatch) symbols.push({ name: classMatch[1], type: "class", file: filePath, line: lineNo });
    // Interfaces
    const ifaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
    if (ifaceMatch) symbols.push({ name: ifaceMatch[1], type: "interface", file: filePath, line: lineNo });
    // Types
    const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)\s*=/);
    if (typeMatch) symbols.push({ name: typeMatch[1], type: "type", file: filePath, line: lineNo });
  });

  return symbols;
}

/**
 * Extracts import paths from TypeScript/JavaScript source code.
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(content)) !== null) {
    imports.push(m[1]);
  }
  return imports;
}

/**
 * Extracts export names from TypeScript/JavaScript source code.
 */
function extractExports(content: string): string[] {
  const exports: string[] = [];
  const exportRegex = /export\s+(?:default\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = exportRegex.exec(content)) !== null) {
    exports.push(m[1]);
  }
  return exports;
}

/**
 * Builds an in-memory index from an array of GeneratedFile objects.
 */
export function indexFiles(files: GeneratedFile[]): RepoIndex {
  const symbols = new Map<string, SymbolEntry>();
  const imports = new Map<string, string[]>();
  const exportsMap = new Map<string, string[]>();
  const filesMap = new Map<string, string>();

  for (const file of files) {
    filesMap.set(file.path, file.content);

    if (/\.(ts|tsx|js|jsx)$/.test(file.path)) {
      const fileSymbols = extractSymbols(file.content, file.path);
      for (const sym of fileSymbols) {
        symbols.set(`${file.path}:${sym.name}`, sym);
      }
      imports.set(file.path, extractImports(file.content));
      exportsMap.set(file.path, extractExports(file.content));
    }
  }

  return { symbols, imports, exports: exportsMap, files: filesMap };
}

/**
 * Performs a simple text/symbol search over the repo index.
 */
export function searchIndex(index: RepoIndex, query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [path, content] of index.files) {
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      const lower = line.toLowerCase();
      const idx = lower.indexOf(lowerQuery);
      if (idx !== -1) {
        // Simple TF-based score
        const occurrences = (lower.match(new RegExp(lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
        results.push({
          file: path,
          line: i + 1,
          snippet: line.trim(),
          score: occurrences / (lines.length || 1),
        });
      }
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 50);
}

/**
 * Builds an import dependency graph from the repo index.
 */
export function getFileGraph(index: RepoIndex): FileGraph {
  const nodes = Array.from(index.files.keys());
  const edges: Array<{ from: string; to: string }> = [];

  for (const [path, importPaths] of index.imports) {
    for (const imp of importPaths) {
      // Resolve relative imports
      if (imp.startsWith(".")) {
        const dir = path.split("/").slice(0, -1).join("/");
        const resolved = `${dir}/${imp}`.replace(/\/\//g, "/");
        edges.push({ from: path, to: resolved });
      } else {
        edges.push({ from: path, to: imp });
      }
    }
  }

  return { nodes, edges };
}
