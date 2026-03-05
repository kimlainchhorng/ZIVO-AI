// Refactoring engine — static analysis to suggest refactors + OpenAI-powered application.

import OpenAI from "openai";

export interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

export type RefactorType =
  | "extract-component"
  | "extract-hook"
  | "split-file"
  | "rename-symbol"
  | "optimize-imports"
  | "add-types"
  | "modernize-syntax";

export interface RefactorSuggestion {
  type: RefactorType;
  file: string;
  description: string;
  impact: "high" | "medium" | "low";
  automated: boolean;
}

// Max characters of a file sent to the LLM for refactoring (fits within gpt-4o-mini's context).
const MAX_REFACTOR_CONTENT_CHARS = 6000;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Heuristic thresholds
const LARGE_FILE_LINES = 200;
const HUGE_FILE_LINES = 400;
const MAX_COMPONENT_LINES = 150;

function _countLines(content: string): number {
  return content.split("\n").length;
}

function _hasTypeScript(file: GeneratedFile): boolean {
  return file.path.endsWith(".ts") || file.path.endsWith(".tsx");
}

function _hasAnyType(content: string): boolean {
  return /:\s*any\b/.test(content) || /as\s+any\b/.test(content);
}

function _hasOldSyntax(content: string): boolean {
  // var declarations, .bind(this), componentDidMount, etc.
  return (
    /\bvar\s+\w+/.test(content) ||
    /\.bind\(this\)/.test(content) ||
    /componentDidMount|componentWillMount|componentDidUpdate/.test(content) ||
    /React\.createClass/.test(content)
  );
}

function _countJsxElements(content: string): number {
  return (content.match(/return\s*\(/g) ?? []).length;
}

function _hasInlineEventHandlers(content: string): boolean {
  // onClick={() => { ... }} with multi-line bodies.
  // Note: the 's' (dotAll) flag requires ES2018; the tsconfig targets ES2017, so we use a line-count heuristic instead.
  const match = content.match(/on\w+\s*=\s*\{/);
  if (!match || match.index === undefined) return false;
  const slice = content.slice(match.index, match.index + 300);
  return slice.split("\n").length > 3;
}

function _countUseStateHooks(content: string): number {
  return (content.match(/useState\s*</g) ?? []).length;
}

export function analyzeForRefactoring(files: GeneratedFile[]): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];

  for (const file of files) {
    const { content, path: filePath } = file;
    const lines = _countLines(content);

    // Very large files → split
    if (lines > HUGE_FILE_LINES) {
      suggestions.push({
        type: "split-file",
        file: filePath,
        description: `File has ${lines} lines. Split into smaller modules for better maintainability and tree-shaking.`,
        impact: "high",
        automated: true,
      });
    } else if (lines > LARGE_FILE_LINES) {
      suggestions.push({
        type: "split-file",
        file: filePath,
        description: `File has ${lines} lines. Consider splitting to improve readability.`,
        impact: "medium",
        automated: false,
      });
    }

    // Large component with multiple return blocks → extract components
    if (
      (filePath.endsWith(".tsx") || filePath.endsWith(".jsx")) &&
      lines > MAX_COMPONENT_LINES &&
      _countJsxElements(content) > 2
    ) {
      suggestions.push({
        type: "extract-component",
        file: filePath,
        description: `Component has multiple JSX return blocks and is ${lines} lines long. Extract sub-components to improve readability.`,
        impact: "high",
        automated: true,
      });
    }

    // Many useState hooks → extract custom hook
    const stateCount = _countUseStateHooks(content);
    if (stateCount >= 4) {
      suggestions.push({
        type: "extract-hook",
        file: filePath,
        description: `Component uses ${stateCount} useState hooks. Extract state logic into a custom hook for reusability.`,
        impact: "medium",
        automated: true,
      });
    }

    // Inline complex event handlers → extract hook or move to handler
    if (_hasInlineEventHandlers(content)) {
      suggestions.push({
        type: "extract-hook",
        file: filePath,
        description: "Complex inline event handlers detected. Extract to named handler functions or a custom hook.",
        impact: "low",
        automated: false,
      });
    }

    // Unused / wildcard imports
    const wildcardImports = content.match(/import\s+\*\s+as\s+\w+/g) ?? [];
    if (wildcardImports.length > 0) {
      suggestions.push({
        type: "optimize-imports",
        file: filePath,
        description: `${wildcardImports.length} wildcard import(s) detected. Named imports allow better tree-shaking.`,
        impact: "low",
        automated: true,
      });
    }

    // TypeScript files using `any`
    if (_hasTypeScript(file) && _hasAnyType(content)) {
      suggestions.push({
        type: "add-types",
        file: filePath,
        description: "Usage of `any` type detected. Replace with specific types to improve type safety.",
        impact: "medium",
        automated: true,
      });
    }

    // Old/legacy React syntax
    if (_hasOldSyntax(content)) {
      suggestions.push({
        type: "modernize-syntax",
        file: filePath,
        description:
          "Legacy syntax detected (var, .bind(this), or class lifecycle methods). Modernize to hooks and const/let.",
        impact: "medium",
        automated: true,
      });
    }
  }

  // Sort by impact: high → medium → low
  const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  return suggestions.sort(
    (a, b) => (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2)
  );
}

export async function applyRefactor(
  files: GeneratedFile[],
  suggestion: RefactorSuggestion
): Promise<GeneratedFile[]> {
  const target = files.find((f) => f.path === suggestion.file);
  if (!target) return files;

  if (!process.env.OPENAI_API_KEY) {
    // Return files unchanged if no API key
    return files;
  }

  const client = getClient();

  const systemPrompt = `You are an expert TypeScript/React refactoring engineer.
Apply the requested refactor precisely. Return ONLY a JSON array of file objects:
[{ "path": "...", "content": "...", "action": "create" | "update" }]
Do not include markdown fences or extra text.`;

  const userPrompt = `Refactor type: ${suggestion.type}
Description: ${suggestion.description}
File to refactor: ${suggestion.file}

File content:
\`\`\`
${target.content.slice(0, MAX_REFACTOR_CONTENT_CHARS)}
\`\`\`

Apply the refactor and return the updated (and any new) files as a JSON array.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const text = response.choices[0]?.message?.content ?? "";

  let refactoredFiles: GeneratedFile[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return files;
    refactoredFiles = JSON.parse(jsonMatch[0]) as GeneratedFile[];
  } catch {
    return files;
  }

  // Merge refactored files back into the original list
  const fileMap = new Map<string, GeneratedFile>(files.map((f) => [f.path, f]));
  for (const updated of refactoredFiles) {
    fileMap.set(updated.path, updated);
  }
  return Array.from(fileMap.values());
}
