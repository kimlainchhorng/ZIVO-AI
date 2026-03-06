// lib/ai/json-repair.ts — Recover truncated or malformed JSON from AI responses

/**
 * Attempt to close unclosed brackets, braces, and strings in a truncated JSON string.
 */
export function repairJSON(raw: string): string {
  let s = raw.trim();

  // Close unclosed string: if last non-whitespace char before EOF looks like open string
  // Count unescaped quotes to detect open strings
  let inString = false;
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === '\\' && inString && i + 1 < s.length) { i += 2; continue; }
    if (ch === '"') inString = !inString;
    i++;
  }
  if (inString) s += '"';

  // Track and close open braces/brackets
  const stack: string[] = [];
  inString = false;
  for (let j = 0; j < s.length; j++) {
    const ch = s[j];
    if (ch === '\\' && inString) { j++; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  // Close all open brackets/braces in reverse order
  while (stack.length > 0) {
    s += stack.pop();
  }

  return s;
}

/**
 * Extract the first JSON object or array from a string that may have surrounding text.
 */
export function extractJSONFromText(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start === -1) return null;
  const opener = text[start];
  const closer = opener === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\\' && inString) { i++; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === opener) depth++;
    else if (ch === closer) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  // Truncated — try repair on the slice from start
  return repairJSON(text.slice(start));
}

/**
 * Safely parse JSON with repair attempt and fallback.
 */
export function safeParseJSON<T>(raw: string, fallback: T): T {
  // First try direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Try extracting JSON from text
    const extracted = extractJSONFromText(raw);
    if (extracted) {
      try {
        return JSON.parse(extracted) as T;
      } catch {
        // Try repairing the extracted JSON
        try {
          return JSON.parse(repairJSON(extracted)) as T;
        } catch {
          // All attempts failed
        }
      }
    }
    return fallback;
  }
}
