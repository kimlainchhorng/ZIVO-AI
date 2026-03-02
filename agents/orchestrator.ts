// ZIVO AI – Multi-Agent Orchestrator
// Coordinates all specialist agents to complete complex tasks

import OpenAI from "openai";
import { BaseAgent } from "./base-agent";
import { ArchitectAgent } from "./architect-agent";
import { UIAgent } from "./ui-agent";
import { BackendAgent } from "./backend-agent";
import { QAAgent } from "./qa-agent";
import { DevOpsAgent } from "./devops-agent";
import type { AgentRole, AgentResult, MultiAgentRequest, MultiAgentResponse } from "../lib/types";

const ALL_ROLES: AgentRole[] = ["architect", "ui", "backend", "qa", "devops"];

function createAgent(role: AgentRole, model?: string): BaseAgent {
  switch (role) {
    case "architect": return new ArchitectAgent(model);
    case "ui":        return new UIAgent(model);
    case "backend":   return new BackendAgent(model);
    case "qa":        return new QAAgent(model);
    case "devops":    return new DevOpsAgent(model);
  }
}

export class MultiAgentOrchestrator {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-4.1-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async run(request: MultiAgentRequest): Promise<MultiAgentResponse> {
    const roles = request.agents ?? ALL_ROLES;
    const contextStr = request.context
      ? JSON.stringify(request.context, null, 2)
      : undefined;

    // Run all requested agents in parallel
    const results = await Promise.all(
      roles.map((role) => this.runAgent(role, request.task, contextStr))
    );

    // Synthesise results
    const synthesis = await this.synthesise(request.task, results);

    return {
      task: request.task,
      results,
      synthesis: synthesis.summary,
      conflicts: synthesis.conflicts,
      action_items: synthesis.action_items,
    };
  }

  private async runAgent(
    role: AgentRole,
    task: string,
    context?: string
  ): Promise<AgentResult> {
    const agent = createAgent(role, this.model);
    const start = Date.now();
    try {
      const messages = agent.buildMessages(task, context);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 2048,
      });
      const output = response.choices[0]?.message?.content ?? "";
      return {
        agent: role,
        success: true,
        output,
        duration_ms: Date.now() - start,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        agent: role,
        success: false,
        output: "",
        errors: [message],
        duration_ms: Date.now() - start,
      };
    }
  }

  private async synthesise(
    task: string,
    results: AgentResult[]
  ): Promise<{ summary: string; conflicts?: string[]; action_items?: string[] }> {
    const agentOutputs = results
      .filter((r) => r.success)
      .map((r) => `[${r.agent.toUpperCase()} AGENT]\n${r.output}`)
      .join("\n\n---\n\n");

    const prompt = `You are the Orchestrator for a multi-agent AI system.

Task: ${task}

Agent outputs:
${agentOutputs}

Synthesise these outputs into:
1. A clear, actionable summary
2. Any conflicts or contradictions between agents
3. Prioritised action items

Return JSON: { "summary": "...", "conflicts": ["..."], "action_items": ["..."] }`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      });
      const text = response.choices[0]?.message?.content ?? "{}";
      return JSON.parse(text);
    } catch {
      return { summary: agentOutputs.slice(0, 500) };
    }
  }
}

export default MultiAgentOrchestrator;
