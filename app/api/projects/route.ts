import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface GeneratedProject {
  id: string;
  name: string;
  description: string;
  prompt: string;
  template: string;
  features: string[];
  files: Record<string, string>;
  schema: any | null;
  createdAt: string;
}

// In-memory storage for generated projects (in production, use a database)
let projects: GeneratedProject[] = [];

export function addProject(project: GeneratedProject): void {
  projects.push(project);
}

export function getProjects(): GeneratedProject[] {
  return [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getProjectById(id: string): GeneratedProject | undefined {
  return projects.find(p => p.id === id);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const project = getProjectById(id);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ project });
    }

    return NextResponse.json({ projects: getProjects() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch projects" }, { status: 500 });
  }
}
