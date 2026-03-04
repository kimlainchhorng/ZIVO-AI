// lib/ai/file-map.ts — File map / repo indexer

export interface FileEntry {
  path: string;
  content?: string;
  size?: number;
  language?: string;
  lastModified?: Date;
}

export interface FileMap {
  files: FileEntry[];
  directories: string[];
  totalFiles: number;
  languages: Record<string, number>;
}

const LANGUAGE_MAP: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  css: "CSS",
  scss: "SCSS",
  html: "HTML",
  json: "JSON",
  md: "Markdown",
  py: "Python",
  prisma: "Prisma",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
  sh: "Shell",
  toml: "TOML",
  env: "Env",
};

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_MAP[ext] ?? "Text";
}

function getDirectories(paths: string[]): string[] {
  const dirs = new Set<string>();
  for (const p of paths) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  return Array.from(dirs).sort();
}

export function buildFileMap(
  files: { path: string; content: string }[]
): FileMap {
  const languages: Record<string, number> = {};
  const entries: FileEntry[] = files.map((f) => {
    const lang = detectLanguage(f.path);
    languages[lang] = (languages[lang] ?? 0) + 1;
    return {
      path: f.path,
      content: f.content,
      size: f.content.length,
      language: lang,
    };
  });

  return {
    files: entries,
    directories: getDirectories(files.map((f) => f.path)),
    totalFiles: files.length,
    languages,
  };
}

export function summarizeFileMap(map: FileMap): string {
  const langSummary = Object.entries(map.languages)
    .map(([lang, count]) => `${lang}: ${count}`)
    .join(", ");
  return `${map.totalFiles} files in ${map.directories.length} directories. Languages: ${langSummary}`;
}

export function getProjectContext(
  map: FileMap,
  maxTokens = 4000
): string {
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;
  let context = `Project: ${summarizeFileMap(map)}\n\nFiles:\n`;
  let charCount = context.length;

  for (const file of map.files) {
    const snippet = file.content?.slice(0, 200) ?? "";
    const line = `- ${file.path} (${file.language}): ${snippet}${(file.content?.length ?? 0) > 200 ? "…" : ""}\n`;
    if (charCount + line.length > maxChars) break;
    context += line;
    charCount += line.length;
  }

  return context;
}
