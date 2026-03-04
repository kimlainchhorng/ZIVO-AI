// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodeBlock {
  language: string;
  code: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  action?: "create" | "update" | "delete";
  language?: string;
}

// ─── Markdown fence stripping ─────────────────────────────────────────────────

/**
 * Strips leading/trailing markdown code fences from a text string.
 * This is the single source of truth for fence removal across all API routes.
 */
export function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:\w+)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

// ─── Code block extraction ────────────────────────────────────────────────────

/**
 * Extracts all fenced code blocks from a markdown/text string.
 */
export function extractCodeBlocks(text: string): CodeBlock[] {
  const pattern = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: CodeBlock[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }
  return blocks;
}

// ─── JSON response parsing ────────────────────────────────────────────────────

/**
 * Parses a standard `{files: [...]}` JSON response from the AI with error handling.
 */
export function parseGeneratedFiles(text: string): GeneratedFile[] {
  const cleaned = stripMarkdownFences(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to find a JSON object anywhere in the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("AI response does not contain valid JSON");
    }
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Failed to parse JSON from AI response");
    }
  }

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "files" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).files)
  ) {
    return (parsed as { files: GeneratedFile[] }).files;
  }

  throw new Error("AI response missing required 'files' array");
}

// ─── File validation ──────────────────────────────────────────────────────────

/**
 * Validates that a file object has the required fields: path and content.
 */
export function validateFileStructure(files: unknown[]): GeneratedFile[] {
  const valid: GeneratedFile[] = [];
  for (const f of files) {
    if (
      f &&
      typeof f === "object" &&
      typeof (f as Record<string, unknown>).path === "string" &&
      typeof (f as Record<string, unknown>).content === "string"
    ) {
      valid.push(f as GeneratedFile);
    }
  }
  return valid;
}

// ─── Token count estimate ─────────────────────────────────────────────────────

/**
 * Rough estimate of token count: ~4 characters per token.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
