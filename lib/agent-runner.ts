import OpenAI from "openai";
import type { AgentRole, AgentMessage, AgentResponse, ReasoningStep } from "./types";
import { buildSystemPrompt } from "./system-prompts";
import { executeToolCall, TOOLS } from "./tools";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Parse JSON response from AI, stripping markdown code fences if present
function parseJsonResponse(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return { reasoning: text, rawOutput: text };
  }
}

export async function runAgent(
  role: AgentRole,
  userMessage: string,
  context?: string,
  conversationHistory: AgentMessage[] = []
): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(role, context);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const completion = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const rawContent = completion.choices[0]?.message?.content ?? "{}";
  const output = parseJsonResponse(rawContent);

  return {
    agentRole: role,
    reasoning: String(output.reasoning ?? ""),
    output,
    toolCalls: [],
    nextSteps: Array.isArray(output.nextSteps) ? (output.nextSteps as string[]) : [],
  };
}

export async function runAgentWithTools(
  role: AgentRole,
  userMessage: string,
  context?: string,
  conversationHistory: AgentMessage[] = [],
  enabledTools: string[] = Object.keys(TOOLS)
): Promise<{ response: AgentResponse; steps: ReasoningStep[] }> {
  const systemPrompt = buildSystemPrompt(role, context);
  const steps: ReasoningStep[] = [];

  const toolDefs: OpenAI.Chat.ChatCompletionTool[] = enabledTools
    .filter((t) => TOOLS[t])
    .map((t) => {
      const tool = TOOLS[t];
      const properties: Record<string, { type: string; description: string }> = {};
      const required: string[] = [];

      for (const [key, param] of Object.entries(tool.parameters)) {
        properties[key] = { type: param.type, description: param.description };
        if (param.required) required.push(key);
      }

      return {
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: { type: "object", properties, required },
        },
      };
    });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  let iterCount = 0;
  const maxIter = 5;

  while (iterCount < maxIter) {
    iterCount++;
    const completion = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolDefs,
      tool_choice: "auto",
      temperature: 0.3,
    });

    const choice = completion.choices[0];
    const assistantMsg = choice.message;
    messages.push(assistantMsg as OpenAI.Chat.ChatCompletionMessageParam);

    if (choice.finish_reason === "stop" || !assistantMsg.tool_calls?.length) {
      const rawContent = assistantMsg.content ?? "{}";
      const output = parseJsonResponse(rawContent);
      return {
        response: {
          agentRole: role,
          reasoning: String(output.reasoning ?? rawContent),
          output,
          toolCalls: steps.flatMap((s) => (s.action ? [s.action] : [])),
          nextSteps: Array.isArray(output.nextSteps) ? (output.nextSteps as string[]) : [],
        },
        steps,
      };
    }

    // Execute tool calls
    const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];

    for (const tc of assistantMsg.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      } catch {
        // keep empty args
      }

      const stepId = `step-${steps.length + 1}`;
      const step: ReasoningStep = {
        id: stepId,
        agentRole: role,
        thought: `Calling tool: ${tc.function.name}`,
        action: { id: tc.id, name: tc.function.name, arguments: args },
        dependencies: [],
        status: "running",
        startedAt: new Date().toISOString(),
      };
      steps.push(step);

      const result = await executeToolCall({ id: tc.id, name: tc.function.name, arguments: args });

      step.result = result;
      step.status = result.error ? "failed" : "completed";
      step.completedAt = new Date().toISOString();

      toolResults.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result.error ? { error: result.error } : result.result),
      });
    }

    messages.push(...toolResults);
  }

  // Max iterations reached – return what we have
  return {
    response: {
      agentRole: role,
      reasoning: "Max tool iterations reached",
      output: { reasoning: "Max tool iterations reached" },
      toolCalls: steps.flatMap((s) => (s.action ? [s.action] : [])),
      nextSteps: [],
    },
    steps,
  };
}
