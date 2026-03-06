// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileEntry {
  path: string;
  content: string;
}

export interface TechStack {
  framework?: string;
  language?: string;
  database?: string;
  styling?: string;
  extras?: string[];
}

// ─── System prompt builder ─────────────────────────────────────────────────────

/**
 * Builds a standard ZIVO AI system prompt with role, expertise, and output format.
 */
export function buildSystemPrompt(
  role: string,
  expertise: string,
  outputFormat: string
): string {
  return `You are ZIVO AI — ${role}.

Expertise: ${expertise}

Output format:
${outputFormat}

Always follow these rules:
- Write production-ready, type-safe TypeScript code
- Use modern Next.js App Router patterns
- Apply Tailwind CSS for styling
- Never include TODO comments or placeholder logic
- Return ONLY valid JSON unless otherwise specified`;
}

// ─── Project context builder ──────────────────────────────────────────────────

/**
 * Builds a context string from existing project files (truncates large files).
 */
export function buildProjectContext(files: FileEntry[]): string {
  if (files.length === 0) return "";
  const MAX_CHARS_PER_FILE = 800;
  const lines: string[] = ["Existing project files (for reference):"];
  for (const f of files) {
    const preview = f.content.slice(0, MAX_CHARS_PER_FILE);
    const truncated = f.content.length > MAX_CHARS_PER_FILE ? "…(truncated)" : "";
    lines.push(`\n// ${f.path}\n${preview}${truncated}`);
  }
  return lines.join("\n");
}

// ─── Tech stack context ────────────────────────────────────────────────────────

/**
 * Builds a tech stack context section to append to prompts.
 */
export function buildTechStackContext(stack: TechStack): string {
  const parts: string[] = ["Tech stack:"];
  if (stack.framework) parts.push(`- Framework: ${stack.framework}`);
  if (stack.language) parts.push(`- Language: ${stack.language}`);
  if (stack.database) parts.push(`- Database: ${stack.database}`);
  if (stack.styling) parts.push(`- Styling: ${stack.styling}`);
  if (stack.extras && stack.extras.length > 0) {
    parts.push(`- Additional: ${stack.extras.join(", ")}`);
  }
  return parts.join("\n");
}

// ─── Output format instructions ───────────────────────────────────────────────

/**
 * Builds output format instructions for a given JSON schema shape.
 */
export function buildOutputFormatInstructions(
  schema: Record<string, string>
): string {
  const fields = Object.entries(schema)
    .map(([key, desc]) => `  "${key}": ${desc}`)
    .join(",\n");
  return `Respond ONLY with a valid JSON object (no markdown fences, no extra text):\n{\n${fields}\n}`;
}
