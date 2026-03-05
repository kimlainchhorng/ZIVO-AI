import { NextResponse } from "next/server";
import { buildDeployConfig, validateForDeploy } from "../../../lib/deployer";

export const runtime = "nodejs";

interface DeployFile {
  path: string;
  content: string;
}

interface DeployVercelBody {
  files: DeployFile[];
  projectName: string;
  envVars?: Record<string, string>;
  token?: string;
}

interface VercelDeployResponse {
  id: string;
  url: string;
  readyState: string;
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { files, projectName, envVars, token } = body as Partial<DeployVercelBody>;

    if (!Array.isArray(files)) {
      return NextResponse.json({ error: "files must be an array" }, { status: 400 });
    }
    if (!projectName || typeof projectName !== "string") {
      return NextResponse.json({ error: "projectName is required" }, { status: 400 });
    }
    for (const f of files) {
      if (!f || typeof (f as DeployFile).path !== "string" || typeof (f as DeployFile).content !== "string") {
        return NextResponse.json(
          { error: "Each file must have path (string) and content (string)" },
          { status: 400 }
        );
      }
    }

    const fileArray = files as DeployFile[];
    const validation = validateForDeploy(fileArray);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Files are not deployment-ready", errors: validation.errors, warnings: validation.warnings },
        { status: 400 }
      );
    }

    const vercelToken = token ?? process.env.VERCEL_TOKEN;
    const config = buildDeployConfig(fileArray, "vercel");

    if (vercelToken) {
      // Call Vercel Deploy API
      try {
        const deployRes = await fetch("https://api.vercel.com/v13/deployments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName,
            files: fileArray.map((f) => ({
              file: f.path,
              data: Buffer.from(f.content).toString("base64"),
              encoding: "base64",
            })),
            projectSettings: { framework: "nextjs" },
            env: envVars ?? {},
          }),
        });

        if (deployRes.ok) {
          const data = await deployRes.json() as VercelDeployResponse;
          return NextResponse.json({
            deployed: true,
            url: `https://${data.url}`,
            deploymentId: data.id,
            config,
          });
        }
      } catch {
        // Fall through to mock deployment
      }
    }

    // Mock deploy response when no token or API call fails
    const mockId = `dpl_${Date.now()}`;
    const mockUrl = `https://${projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}.vercel.app`;

    return NextResponse.json({
      deployed: false,
      url: mockUrl,
      deploymentId: mockId,
      downloadUrl: `/api/download?project=${encodeURIComponent(projectName)}`,
      config,
      warnings: validation.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
