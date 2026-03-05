import type { ProjectMemory } from "../project-memory";

export interface ContextSnapshot {
  isFollowUp: boolean;
  existingFileCount: number;
  existingFilePaths: string[];
  existingFilesForContext: { path: string; content: string }[];
  blueprintSummary: string;
  conversationContext: string;
  techStackContext: string;
}

/** Max chars of each file's content to include in context */
const MAX_FILE_CHARS = 500;

/** Regex that identifies key files worth including in the context snapshot */
const KEY_FILE_PATTERN = /\/(page|layout|route|schema)\.(tsx?|prisma)$/;

export function buildContextSnapshot(memory: ProjectMemory | undefined): ContextSnapshot {
  if (!memory || memory.files.length === 0) {
    return {
      isFollowUp: false,
      existingFileCount: 0,
      existingFilePaths: [],
      existingFilesForContext: [],
      blueprintSummary: "",
      conversationContext: "",
      techStackContext: "",
    };
  }

  const existingFilePaths = memory.files.map((f) => f.path);

  // For context, include truncated content of key files
  const keyFiles = memory.files.filter(
    (f) =>
      KEY_FILE_PATTERN.test(f.path) ||
      f.path === "package.json" ||
      f.path === "prisma/schema.prisma"
  );

  const existingFilesForContext = keyFiles.map((f) => ({
    path: f.path,
    content:
      f.content.slice(0, MAX_FILE_CHARS) +
      (f.content.length > MAX_FILE_CHARS ? "\n// ... truncated" : ""),
  }));

  const blueprintSummary = memory.blueprint
    ? `Goal: ${memory.blueprint.goal}\nPages: ${memory.blueprint.pages.map((p) => p.route).join(", ")}\nAPI: ${memory.blueprint.apiRoutes.map((r) => r.path).join(", ")}`
    : "";

  // Last 4 conversation turns for context
  const recentTurns = memory.conversationHistory.slice(-4);
  const conversationContext = recentTurns
    .map((t) => `${t.role.toUpperCase()}: ${t.content.slice(0, 200)}`)
    .join("\n");

  const techStackContext =
    memory.techStack.length > 0 ? `Tech stack: ${memory.techStack.join(", ")}` : "";

  return {
    isFollowUp: true,
    existingFileCount: memory.files.length,
    existingFilePaths,
    existingFilesForContext,
    blueprintSummary,
    conversationContext,
    techStackContext,
  };
}
