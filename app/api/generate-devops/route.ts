import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export interface DevOpsFile {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
}

export interface GenerateDevOpsRequest {
  appName?: string;
  deployTarget?: "vercel" | "railway" | "flyio" | "aws" | "gcp" | "all";
  iacProvider?: "terraform" | "pulumi" | "both";
  orchestration?: "kubernetes" | "docker-compose" | "both";
  monitoring?: Array<"sentry" | "datadog" | "opentelemetry" | "all">;
  ciFeatures?: Array<"lint" | "test" | "build" | "security" | "performance" | "all">;
}

export interface GenerateDevOpsResponse {
  files: DevOpsFile[];
  summary: string;
  setupInstructions: string;
  requiredEnvVars: string[];
}

const DEVOPS_SYSTEM_PROMPT = `You are ZIVO AI — an expert in DevOps, CI/CD, and cloud infrastructure for Next.js applications.

Generate complete CI/CD pipelines and infrastructure-as-code for a Next.js App Router project.

Respond ONLY with a valid JSON object:
{
  "files": [
    { "path": "relative/path", "content": "...", "action": "create" }
  ],
  "summary": "Brief description",
  "setupInstructions": "Step-by-step setup instructions",
  "requiredEnvVars": ["VAR_NAME=description"]
}

Always include:
- .github/workflows/ci.yml — Lint, test, build, type-check pipeline
- .github/workflows/deploy.yml — Deploy to target platform
- .github/workflows/preview.yml — PR preview deployments
- .github/workflows/release.yml — Semantic versioning and changelog
- .github/workflows/security.yml — Security scanning with CodeQL
- .github/workflows/performance.yml — Lighthouse CI performance checks
- docker-compose.prod.yml — Production Docker Compose configuration
- lib/monitoring/sentry.ts — Sentry error tracking setup
- lib/monitoring/opentelemetry.ts — OpenTelemetry distributed tracing

For Kubernetes: include k8s/deployment.yaml, k8s/service.yaml, k8s/ingress.yaml, k8s/hpa.yaml
For Terraform: include terraform/main.tf, terraform/variables.tf, terraform/outputs.tf
For Pulumi: include pulumi/index.ts with TypeScript IaC

Return ONLY valid JSON, no markdown fences, no extra text.`;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing in environment" },
        { status: 500 }
      );
    }

    let body: GenerateDevOpsRequest;
    try {
      body = await req.json() as GenerateDevOpsRequest;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    const {
      appName = "My App",
      deployTarget = "vercel",
      iacProvider = "terraform",
      orchestration = "kubernetes",
      monitoring = ["all"],
      ciFeatures = ["all"],
    } = body;

    const monitoringTools = monitoring.includes("all")
      ? ["sentry", "datadog", "opentelemetry"]
      : monitoring;

    const ciSteps = ciFeatures.includes("all")
      ? ["lint", "test", "build", "security", "performance"]
      : ciFeatures;

    const userPrompt = `Generate complete CI/CD and DevOps infrastructure for "${appName}".
Deploy target: ${deployTarget}
IaC provider: ${iacProvider}
Container orchestration: ${orchestration}
Monitoring tools: ${monitoringTools.join(", ")}
CI/CD steps: ${ciSteps.join(", ")}

Generate:
1. GitHub Actions workflows (ci.yml, deploy.yml, preview.yml, release.yml, security.yml, performance.yml)
2. Infrastructure as Code (${iacProvider} configuration)
3. Container orchestration (${orchestration} manifests)
4. Production Docker Compose (docker-compose.prod.yml)
5. Monitoring setup (${monitoringTools.join(", ")})
6. Helm chart (helm/Chart.yaml, helm/values.yaml, helm/templates/)`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      max_tokens: 8192,
      messages: [
        { role: "system", content: DEVOPS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const text = response.choices?.[0]?.message?.content ?? "";

    let parsed: GenerateDevOpsResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "AI did not return valid JSON" },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    if (!Array.isArray(parsed.files)) {
      return NextResponse.json(
        { error: "Invalid response structure: missing files array" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || "Server error" },
      { status: 500 }
    );
  }
}
