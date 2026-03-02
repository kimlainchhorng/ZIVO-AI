import { NextResponse } from "next/server";
import { getProjectById } from "../projects/route";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectId, platform } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const project = getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deployPlatform = platform || "vercel";

    // Generate deployment configuration
    const deployConfig = generateDeployConfig(deployPlatform, project.name);

    return NextResponse.json({
      ok: true,
      platform: deployPlatform,
      config: deployConfig,
      instructions: getDeployInstructions(deployPlatform, project.name),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Deploy configuration failed" }, { status: 500 });
  }
}

function generateDeployConfig(platform: string, projectName: string): Record<string, any> {
  const slug = projectName.toLowerCase().replace(/\s+/g, "-");

  switch (platform) {
    case "vercel":
      return {
        "vercel.json": JSON.stringify(
          {
            name: slug,
            buildCommand: "npm run build",
            outputDirectory: "dist",
            framework: "vite",
            env: {
              VITE_SUPABASE_URL: "@supabase_url",
              VITE_SUPABASE_ANON_KEY: "@supabase_anon_key",
            },
          },
          null,
          2
        ),
        ".github/workflows/deploy.yml": generateGitHubActionsWorkflow(slug),
      };
    case "docker":
      return {
        Dockerfile: generateDockerfile(slug),
        "docker-compose.yml": generateDockerCompose(slug),
        ".dockerignore": "node_modules\ndist\n.env.local\n",
      };
    default:
      return {};
  }
}

function generateGitHubActionsWorkflow(slug: string): string {
  return `name: Deploy ${slug}

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
`;
}

function generateDockerfile(slug: string): string {
  return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
}

function generateDockerCompose(slug: string): string {
  return `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=\${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=\${VITE_SUPABASE_ANON_KEY}
    restart: unless-stopped
`;
}

function getDeployInstructions(platform: string, projectName: string): string[] {
  switch (platform) {
    case "vercel":
      return [
        "1. Install Vercel CLI: npm i -g vercel",
        "2. Run: vercel login",
        "3. Run: vercel --prod in your project directory",
        "4. Set environment variables in Vercel dashboard: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
        "5. Your app will be live at https://your-project.vercel.app",
      ];
    case "docker":
      return [
        "1. Build Docker image: docker-compose build",
        "2. Run container: docker-compose up -d",
        "3. Access at http://localhost:3000",
        "4. Set environment variables in .env file",
      ];
    default:
      return ["Deploy using your preferred hosting platform"];
  }
}
