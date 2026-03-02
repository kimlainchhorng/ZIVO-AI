import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const PROJECTS_DIR = path.join(process.cwd(), "projects");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, htmlContent, metadata } = body;

    // Validate input
    if (!projectId || !htmlContent) {
      return NextResponse.json(
        { error: "Project ID and HTML content are required." },
        { status: 400 }
      );
    }

    // Create projects directory if it does not exist
    await fs.promises.mkdir(PROJECTS_DIR, { recursive: true });

    // Define the file path
    const filePath = path.join(PROJECTS_DIR, `${projectId}.html`);

    // Save the HTML content to a file
    await fs.promises.writeFile(filePath, htmlContent);

    return NextResponse.json({ message: "Site saved successfully!", metadata });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to save the project: " + (error?.message ?? error) },
      { status: 500 }
    );
  }
}