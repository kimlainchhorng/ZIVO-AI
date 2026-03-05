import { exportProjectAsJSON, exportProjectAsZip, type ProjectMetadata } from "@/lib/project-io";

export const runtime = "nodejs";

interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

interface ExportBody {
  files?: GeneratedFile[];
  format?: "zip" | "json";
  projectName?: string;
  metadata?: Partial<ProjectMetadata>;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as ExportBody;
  const { files = [], format = "json", projectName = "my-project", metadata } = body;

  const fullMetadata: ProjectMetadata = {
    name: projectName,
    description: metadata?.description ?? "",
    techStack: metadata?.techStack ?? ["Next.js", "TypeScript"],
    createdAt: metadata?.createdAt ?? new Date().toISOString(),
    version: metadata?.version ?? "1.0.0",
  };

  if (format === "zip") {
    const blob = await exportProjectAsZip(files, projectName);
    const arrayBuffer = await blob.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${projectName}.zip"`,
      },
    });
  }

  const json = exportProjectAsJSON(files, fullMetadata);
  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${projectName}.json"`,
    },
  });
}
