import { NextResponse } from "next/server";
import OpenAI from "openai";
import { addRun } from "../store";

export const runtime = "nodejs";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface WorkflowNode {
  id: string;
  type:
    | "http"
    | "db"
    | "auth"
    | "storage"
    | "email"
    | "payments"
    | "ai"
    | "code"
    | "condition"
    | "loop"
    | "delay";
  config: Record<string, unknown>;
  label: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: "running" | "success" | "failed";
  startedAt: Date;
  completedAt?: Date;
  nodeResults: Record<
    string,
    { status: string; output: unknown; error?: string; durationMs: number }
  >;
  logs: string[];
}

// ─── Node Executors ────────────────────────────────────────────────────────────

type NodeResult = { status: string; output: unknown; error?: string; durationMs: number };

async function executeNode(node: WorkflowNode): Promise<NodeResult> {
  const start = Date.now();

  try {
    switch (node.type) {
      case "http": {
        const url = node.config.url as string | undefined;
        if (!url) throw new Error("Missing config.url for http node");
        const method = (node.config.method as string | undefined) ?? "GET";
        const headers = (node.config.headers as Record<string, string> | undefined) ?? {};
        const bodyRaw = node.config.body;
        const fetchOptions: RequestInit = { method, headers };
        if (bodyRaw !== undefined && method !== "GET" && method !== "HEAD") {
          fetchOptions.body =
            typeof bodyRaw === "string" ? bodyRaw : JSON.stringify(bodyRaw);
        }
        const res = await fetch(url, fetchOptions);
        const text = await res.text();
        let output: unknown;
        try {
          output = JSON.parse(text);
        } catch {
          output = text;
        }
        return { status: res.ok ? "success" : "error", output, durationMs: Date.now() - start };
      }

      case "ai": {
        const prompt = (node.config.prompt as string | undefined) ?? "";
        if (!process.env.OPENAI_API_KEY) {
          return {
            status: "error",
            output: null,
            error: "Missing OPENAI_API_KEY",
            durationMs: Date.now() - start,
          };
        }
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        });
        const output = completion.choices?.[0]?.message?.content ?? "";
        return { status: "success", output, durationMs: Date.now() - start };
      }

      case "condition": {
        const expression = (node.config.expression as string | undefined) ?? "";
        const branch = expression.toLowerCase().includes("true") ? "true" : "false";
        return { status: "success", output: { branch }, durationMs: Date.now() - start };
      }

      case "delay": {
        const ms = (node.config.ms as number | undefined) ?? 0;
        await new Promise<void>((resolve) => setTimeout(resolve, Math.min(ms, 5000)));
        return {
          status: "success",
          output: { delayed: true, requestedMs: ms },
          durationMs: Date.now() - start,
        };
      }

      case "db":
        return {
          status: "success",
          output: { rows: [{ id: 1, data: "sample-db-row" }], rowCount: 1 },
          durationMs: Date.now() - start,
        };

      case "auth":
        return {
          status: "success",
          output: { authenticated: true, userId: "usr_mock_001", role: "user" },
          durationMs: Date.now() - start,
        };

      case "storage":
        return {
          status: "success",
          output: { url: "https://storage.example.com/mock-file.bin", size: 1024 },
          durationMs: Date.now() - start,
        };

      case "email": {
        const to = (node.config.to as string | undefined) ?? "";
        const subject = (node.config.subject as string | undefined) ?? "Notification";
        const html = (node.config.html as string | undefined) ?? (node.config.body as string | undefined) ?? "";
        const from = (node.config.from as string | undefined) ?? "ZIVO AI <no-reply@example.com>";

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          // Log-only mode when key is absent
          return {
            status: "success",
            output: {
              sent: false,
              simulated: true,
              messageId: `sim_${Date.now()}`,
              to,
              subject,
              note: "RESEND_API_KEY not configured — email simulated",
            },
            durationMs: Date.now() - start,
          };
        }

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to, subject, html: html || `<p>${subject}</p>` }),
        });
        const resendData = await resendRes.json() as { id?: string; error?: { message?: string } };
        if (!resendRes.ok) {
          throw new Error(resendData.error?.message ?? "Resend API error");
        }
        return {
          status: "success",
          output: { sent: true, messageId: resendData.id ?? `msg_${Date.now()}`, to, subject },
          durationMs: Date.now() - start,
        };
      }

      case "db": {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          // Fallback to mock when Supabase credentials are absent
          return {
            status: "success",
            output: { rows: [{ id: 1, data: "sample-db-row" }], rowCount: 1, simulated: true },
            durationMs: Date.now() - start,
          };
        }

        const table = (node.config.table as string | undefined) ?? "";
        const operation = (node.config.operation as string | undefined) ?? "select";
        const data = (node.config.data as Record<string, unknown> | undefined) ?? {};
        const filters = (node.config.filters as Record<string, unknown> | undefined) ?? {};

        if (!table) throw new Error("Missing config.table for db node");

        let endpoint = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`;
        let method = "GET";
        let requestBody: string | undefined;

        if (operation === "insert") {
          method = "POST";
          requestBody = JSON.stringify(data);
        } else if (operation === "update") {
          method = "PATCH";
          requestBody = JSON.stringify(data);
          const filterParts = Object.entries(filters)
            .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
            .join("&");
          if (filterParts) endpoint += `?${filterParts}`;
        } else if (operation === "delete") {
          method = "DELETE";
          const filterParts = Object.entries(filters)
            .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
            .join("&");
          if (filterParts) endpoint += `?${filterParts}`;
        } else {
          // select
          const filterParts = Object.entries(filters)
            .map(([k, v]) => `${k}=eq.${encodeURIComponent(String(v))}`)
            .join("&");
          if (filterParts) endpoint += `?${filterParts}`;
        }

        const dbRes = await fetch(endpoint, {
          method,
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": operation === "insert" ? "return=representation" : "return=minimal",
          },
          body: requestBody,
        });

        const dbText = await dbRes.text();
        let dbOutput: unknown;
        try { dbOutput = JSON.parse(dbText); } catch { dbOutput = dbText; }

        if (!dbRes.ok) {
          throw new Error(`Supabase ${operation} failed: ${dbText.slice(0, 200)}`);
        }

        return {
          status: "success",
          output: {
            rows: Array.isArray(dbOutput) ? dbOutput : [dbOutput],
            rowCount: Array.isArray(dbOutput) ? dbOutput.length : 1,
            operation,
            table,
          },
          durationMs: Date.now() - start,
        };
      }

      case "code": {
        const expression = (node.config.expression as string | undefined) ?? (node.config.code as string | undefined) ?? "";
        if (!expression.trim()) {
          return { status: "success", output: { result: null, stdout: "" }, durationMs: Date.now() - start };
        }
        // Safe evaluation via new Function (no eval). Only pure JS expressions.
        // Note: This provides basic sandboxing via forbidden keyword patterns.
        // For production use with untrusted code, consider a dedicated sandbox (vm2 / isolated-vm).
        // Disallow access to runtime globals: require, import, process, fetch, globalThis, etc.
        const forbidden = /\b(require|import|process|fetch|globalThis|__dirname|__filename|Buffer|setTimeout|setInterval|clearTimeout|clearInterval)\b/;
        if (forbidden.test(expression)) {
          throw new Error("Code node: disallowed built-in usage detected");
        }
        const output: string[] = [];
        const safeFn = new Function("console", `"use strict";\n${expression}`) as (c: { log: (...args: unknown[]) => void }) => unknown;
        const result: unknown = safeFn({ log: (...args: unknown[]) => output.push(args.map(String).join(" ")) });
        return {
          status: "success",
          output: { result, stdout: output.join("\n"), exitCode: 0 },
          durationMs: Date.now() - start,
        };
      }

      case "loop":
        return {
          status: "success",
          output: { iterations: (node.config.count as number | undefined) ?? 1 },
          durationMs: Date.now() - start,
        };

      default:
        return {
          status: "success",
          output: { mock: true },
          durationMs: Date.now() - start,
        };
    }
  } catch (err: unknown) {
    return {
      status: "error",
      output: null,
      error: (err as Error)?.message ?? "Unknown error",
      durationMs: Date.now() - start,
    };
  }
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  let body: { workflowId?: string; nodes?: unknown; edges?: unknown; input?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nodes = body.nodes;
  const edges = body.edges;

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return NextResponse.json({ error: "nodes must be a non-empty array" }, { status: 400 });
  }

  if (!Array.isArray(edges)) {
    return NextResponse.json({ error: "edges must be an array" }, { status: 400 });
  }

  const workflowId = body.workflowId ?? `wf_${Date.now()}`;
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const run: WorkflowRun = {
    id: runId,
    workflowId,
    status: "running",
    startedAt: new Date(),
    nodeResults: {},
    logs: [`[${new Date().toISOString()}] Workflow run ${runId} started`],
  };

  try {
    const typedNodes = nodes as WorkflowNode[];

    for (const node of typedNodes) {
      run.logs.push(`[${new Date().toISOString()}] Executing node "${node.label}" (${node.type})`);
      const result = await executeNode(node);
      run.nodeResults[node.id] = result;
      run.logs.push(
        `[${new Date().toISOString()}] Node "${node.label}" finished — status: ${result.status}, ${result.durationMs}ms`
      );
    }

    run.status = Object.values(run.nodeResults).some((r) => r.status === "error")
      ? "failed"
      : "success";
    run.completedAt = new Date();
    run.logs.push(`[${new Date().toISOString()}] Workflow run ${runId} completed: ${run.status}`);
  } catch (err: unknown) {
    run.status = "failed";
    run.completedAt = new Date();
    run.logs.push(`[${new Date().toISOString()}] Fatal error: ${(err as Error)?.message}`);
    addRun(run);
    return NextResponse.json({ error: (err as Error)?.message ?? "Execution failed" }, { status: 500 });
  }

  addRun(run);
  return NextResponse.json(run);
}
