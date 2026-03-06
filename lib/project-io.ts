// lib/project-io.ts — Project export/import utilities
import JSZip from "jszip";

export interface ProjectMetadata {
  name: string;
  description: string;
  techStack: string[];
  createdAt: string;
  version: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

export async function exportProjectAsZip(
  files: GeneratedFile[],
  projectName: string
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder(projectName) ?? zip;

  for (const file of files) {
    folder.file(file.path, file.content);
  }

  // Detect env vars and create .env.example
  const envVarPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  const envVars = new Set<string>();
  for (const file of files) {
    for (const match of file.content.matchAll(envVarPattern)) {
      envVars.add(match[1]);
    }
  }
  if (envVars.size > 0) {
    const envExample = Array.from(envVars).map((v) => `${v}=`).join("\n");
    folder.file(".env.example", envExample);
  }

  return zip.generateAsync({ type: "blob" });
}

export function exportProjectAsJSON(
  files: GeneratedFile[],
  metadata: ProjectMetadata
): string {
  return JSON.stringify({ metadata, files }, null, 2);
}

export function importProjectFromJSON(json: string): {
  files: GeneratedFile[];
  metadata: ProjectMetadata;
} {
  const parsed = JSON.parse(json) as { metadata: ProjectMetadata; files: GeneratedFile[] };
  return { files: parsed.files ?? [], metadata: parsed.metadata };
}
