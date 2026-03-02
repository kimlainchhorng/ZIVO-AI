import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Define the shape of our project data
interface Project {
  id: string;
  name: string;
  html: string;
  created_at: string;
}

// Memory storage (optional, as we are also saving to files)
let projects: Project[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    
    // 1. Destructure html and projectName from the request body
    const { html, projectName } = body || {};

    // 2. Validation: Ensure both are provided
    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
    }
    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // 3. Setup dynamic paths and sanitize filename
    const safeName = projectName.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    const folderPath = path.join(process.cwd(), "public", "generated");
    const filePath = path.join(folderPath, `${safeName}.html`);

    // 4. Create folder if it doesn't exist
    await fs.mkdir(folderPath, { recursive: true });

    // 5. Write the file to the project-specific path
    await fs.writeFile(filePath, html, "utf8");

    // 6. Return the success JSON with the dynamic project URL
    return NextResponse.json({ 
      ok: true, 
      url: `/generated/${safeName}.html` 
    }, { status: 200 });

  } catch (err: any) {
    const msg = typeof err?.message === "string" ? err.message : "Failed to save project";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
