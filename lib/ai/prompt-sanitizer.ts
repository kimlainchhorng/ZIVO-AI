// lib/ai/prompt-sanitizer.ts — Sanitize and validate user prompts before AI submission

const MIN_PROMPT_LENGTH = 3;
const MAX_PROMPT_LENGTH = 4000;

/**
 * Sanitizes a user prompt by trimming whitespace, normalizing internal spaces,
 * and removing ASCII control characters (except standard newlines and tabs).
 */
export function sanitizePrompt(input: string): string {
  // Remove ASCII control characters (0x00–0x08, 0x0B–0x0C, 0x0E–0x1F, 0x7F)
  // but preserve \t (0x09), \n (0x0A), and \r (0x0D)
  const noControl = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Normalize multiple consecutive spaces/tabs to a single space
  const normalized = noControl.replace(/[ \t]+/g, " ");
  return normalized.trim();
}

export interface PromptValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a sanitized prompt for minimum/maximum length and repetition.
 */
export function validatePrompt(input: string): PromptValidationResult {
  const sanitized = sanitizePrompt(input);

  if (sanitized.length < MIN_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt must be at least ${MIN_PROMPT_LENGTH} characters.` };
  }

  if (sanitized.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt must not exceed ${MAX_PROMPT_LENGTH} characters (got ${sanitized.length}).`,
    };
  }

  // Reject overly repetitive inputs: if a single word makes up > 60% of all words
  const words = sanitized.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 10) {
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
    const maxCount = Math.max(...freq.values());
    if (maxCount / words.length > 0.6) {
      return { valid: false, error: "Prompt appears to be overly repetitive." };
    }
  }

  return { valid: true };
}

/**
 * Truncates a prompt to at most `maxChars` characters, cutting at the last
 * whitespace boundary to avoid splitting mid-word.
 */
export function truncatePrompt(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  const slice = input.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
}

/**
 * Extracts simple keywords from a prompt by filtering out common stop words.
 * Returns unique, lowercase words longer than 3 characters.
 */
export function extractKeywords(input: string): string[] {
  const STOP_WORDS = new Set([
    "the", "and", "for", "with", "that", "this", "from", "into", "about",
    "have", "has", "had", "not", "but", "are", "was", "were", "will", "can",
    "does", "did", "just", "also", "then", "than", "when", "where", "what",
    "how", "who", "why", "which", "each", "both", "some", "more", "like",
    "very", "such", "only", "been", "being", "should", "would", "could",
    "make", "made", "your", "their", "they", "them", "its", "our", "all",
  ]);

  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  return [...new Set(words)];
}
