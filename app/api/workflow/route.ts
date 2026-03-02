import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config?: Record<string, unknown>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: WorkflowStep[];
  status: string;
  executions: number;
  successRate: number;
  lastRun: string | null;
  createdAt: string;
}

const workflows: Workflow[] = [
  {
    id: "wf-1",
    name: "New User Onboarding",
    description: "Welcome email series and setup guidance for new users",
    trigger: "user.created",
    steps: [
      { id: "s1", type: "email", name: "Send Welcome Email" },
      { id: "s2", type: "delay", name: "Wait 2 Days" },
      { id: "s3", type: "condition", name: "Check Activation" },
      { id: "s4", type: "email", name: "Send Tip Email" },
    ],
    status: "active",
    executions: 1248,
    successRate: 99.2,
    lastRun: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: "wf-2",
    name: "Deployment Pipeline",
    description: "Automated CI/CD workflow with testing and deployment",
    trigger: "git.push",
    steps: [
      { id: "s1", type: "action", name: "Run Tests" },
      { id: "s2", type: "condition", name: "Tests Pass?" },
      { id: "s3", type: "action", name: "Build & Deploy to Staging" },
      { id: "s4", type: "action", name: "Deploy to Production" },
      { id: "s5", type: "notification", name: "Notify Slack" },
    ],
    status: "active",
    executions: 284,
    successRate: 98.6,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 5184000000).toISOString(),
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";

  const filtered = status === "all" ? workflows : workflows.filter((w) => w.status === status);

  return NextResponse.json({
    ok: true,
    workflows: filtered,
    total: filtered.length,
    stats: {
      active: workflows.filter((w) => w.status === "active").length,
      totalExecutions: workflows.reduce((sum, w) => sum + w.executions, 0),
      avgSuccessRate: workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length,
    },
    integrations: [
      "Slack", "Discord", "Microsoft Teams",
      "GitHub", "GitLab", "Jira", "Linear",
      "Stripe", "SendGrid", "Twilio",
      "HubSpot", "Salesforce", "Segment",
      "AWS Lambda", "Google Cloud Functions",
    ],
    triggerTypes: [
      "webhook", "schedule", "event", "manual",
      "user.created", "user.deleted", "payment.success", "payment.failed",
      "git.push", "deploy.success", "deploy.failed", "alert.triggered",
    ],
    stepTypes: ["action", "condition", "delay", "email", "notification", "http", "transform", "loop"],
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, workflow, workflowId } = body;

    if (!action) {
      return NextResponse.json({ error: "Action required" }, { status: 400 });
    }

    if (action === "create") {
      if (!workflow?.name) {
        return NextResponse.json({ error: "Workflow name required" }, { status: 400 });
      }
      const newWorkflow: Workflow = {
        id: `wf-${Date.now()}`,
        name: workflow.name,
        description: workflow.description || "",
        trigger: workflow.trigger || "manual",
        steps: workflow.steps || [],
        status: "draft",
        executions: 0,
        successRate: 100,
        lastRun: null,
        createdAt: new Date().toISOString(),
      };
      workflows.push(newWorkflow);
      return NextResponse.json({ ok: true, action, workflow: newWorkflow });
    }

    if (action === "execute") {
      const wf = workflows.find((w) => w.id === workflowId);
      if (!wf) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
      }
      const execution = {
        id: `exec-${Date.now()}`,
        workflowId,
        workflowName: wf.name,
        status: "running",
        startedAt: new Date().toISOString(),
        steps: wf.steps.map((s) => ({ ...s, status: "pending" })),
      };
      wf.executions += 1;
      wf.lastRun = new Date().toISOString();
      return NextResponse.json({ ok: true, action, execution });
    }

    if (action === "activate" || action === "deactivate") {
      const wf = workflows.find((w) => w.id === workflowId);
      if (!wf) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
      }
      wf.status = action === "activate" ? "active" : "inactive";
      return NextResponse.json({ ok: true, action, workflow: wf });
    }

    return NextResponse.json({ ok: true, action, result: `${action} completed` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Workflow action failed" }, { status: 500 });
  }
}
