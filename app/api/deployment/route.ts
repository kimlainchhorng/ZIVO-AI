import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "overview";

  return NextResponse.json({
    ok: true,
    type,
    deployments: [
      { id: "d1", name: "Production", environment: "prod", status: "healthy", provider: "AWS", region: "us-east-1", version: "v2.4.1", deployedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "d2", name: "Staging", environment: "staging", status: "healthy", provider: "AWS", region: "us-east-1", version: "v2.5.0-rc1", deployedAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "d3", name: "EU Region", environment: "prod", status: "healthy", provider: "GCP", region: "europe-west1", version: "v2.4.1", deployedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "d4", name: "APAC Region", environment: "prod", status: "deploying", provider: "Azure", region: "eastasia", version: "v2.4.2", deployedAt: new Date().toISOString() },
    ],
    providers: [
      { id: "aws", name: "Amazon Web Services", status: "connected", regions: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"] },
      { id: "gcp", name: "Google Cloud Platform", status: "connected", regions: ["us-central1", "europe-west1", "asia-east1"] },
      { id: "azure", name: "Microsoft Azure", status: "connected", regions: ["eastus", "westeurope", "eastasia"] },
    ],
    strategies: ["blue-green", "canary", "rolling", "recreate"],
    stats: {
      successRate: 99.6,
      avgDeployTime: 4.2,
      deploymentsToday: 47,
      rollbacksThisMonth: 2,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, config } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    const deploymentActions: Record<string, object> = {
      deploy: {
        id: `deploy-${Date.now()}`,
        status: "queued",
        strategy: config?.strategy || "rolling",
        provider: config?.provider || "aws",
        region: config?.region || "us-east-1",
        estimatedDuration: "3-5 minutes",
        queuedAt: new Date().toISOString(),
      },
      rollback: {
        id: `rollback-${Date.now()}`,
        status: "executing",
        targetVersion: config?.version || "previous",
        estimatedDuration: "< 30 seconds",
        startedAt: new Date().toISOString(),
      },
      "setup-kubernetes": {
        namespace: config?.namespace || "default",
        replicas: config?.replicas || 3,
        resources: { cpu: "500m", memory: "512Mi" },
        autoscaling: { minReplicas: 2, maxReplicas: 10, targetCPU: 70 },
        files: ["deployment.yaml", "service.yaml", "hpa.yaml", "ingress.yaml"],
      },
      "setup-docker-swarm": {
        services: config?.services || 3,
        networks: ["frontend", "backend", "monitoring"],
        secrets: ["db_password", "api_key"],
        composeFile: "docker-compose.swarm.yml",
      },
    };

    if (action in deploymentActions) {
      return NextResponse.json({ ok: true, action, result: deploymentActions[action] });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Deployment action failed" }, { status: 500 });
  }
}
