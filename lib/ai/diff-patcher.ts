// lib/ai/diff-patcher.ts — Codegen with diff patches

import OpenAI from "openai";

export interface PatchHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[]; // prefixed with +/-/ (space)
}

export interface FilePatch {
  path: string;
  type: "create" | "update" | "delete";
  hunks?: PatchHunk[];
  content?: string;
}

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function applyPatch(original: string, patch: FilePatch): string {
  if (patch.type === "create" || patch.type === "delete") {
    return patch.content ?? "";
  }
  if (!patch.hunks || patch.hunks.length === 0) {
    return patch.content ?? original;
  }

  const lines = original.split("\n");
  const result: string[] = [...lines];
  let offset = 0;

  for (const hunk of patch.hunks) {
    const insertAt = hunk.oldStart - 1 + offset;
    const deleteCount = hunk.oldCount;
    const newLines = hunk.lines
      .filter((l) => l.startsWith("+") || l.startsWith(" "))
      .map((l) => l.slice(1));

    result.splice(insertAt, deleteCount, ...newLines);
    offset += newLines.length - deleteCount;
  }

  return result.join("\n");
}

export function generateDiffSummary(patches: FilePatch[]): string {
  const creates = patches.filter((p) => p.type === "create").length;
  const updates = patches.filter((p) => p.type === "update").length;
  const deletes = patches.filter((p) => p.type === "delete").length;
  const parts: string[] = [];
  if (creates > 0) parts.push(`${creates} created`);
  if (updates > 0) parts.push(`${updates} updated`);
  if (deletes > 0) parts.push(`${deletes} deleted`);
  return parts.join(", ") || "No changes";
}

const PATCH_SYSTEM_PROMPT = `You are a code patch generator. Given a prompt and existing files, generate minimal patches.
Return ONLY valid JSON:
{
  "thinking": "brief reasoning",
  "summary": "what changed",
  "patches": [
    {
      "path": "relative/path.ts",
      "type": "create" | "update" | "delete",
      "content": "full file content for create/delete",
      "hunks": [{ "oldStart": 1, "oldCount": 3, "newStart": 1, "newCount": 4, "lines": [" unchanged", "-removed", "+added"] }]
    }
  ]
}`;

export async function generatePatchesFromPrompt(
  prompt: string,
  existingFiles: { path: string; content: string }[],
  model = "gpt-4o"
): Promise<{ patches: FilePatch[]; thinking: string; summary: string }> {
  const filesContext =
    existingFiles.length > 0
      ? `\n\nExisting files:\n${existingFiles.map((f) => `// ${f.path}\n${f.content.slice(0, 300)}`).join("\n\n")}`
      : "";

  const response = await getClient().chat.completions.create({
    model,
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      { role: "system", content: PATCH_SYSTEM_PROMPT },
      { role: "user", content: `${prompt}${filesContext}` },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as {
      patches: FilePatch[];
      thinking: string;
      summary: string;
    };
    return {
      patches: Array.isArray(parsed.patches) ? parsed.patches : [],
      thinking: parsed.thinking ?? "",
      summary: parsed.summary ?? "",
    };
  } catch {
    return { patches: [], thinking: "Parse error", summary: "Failed to generate patches" };
  }
}
