import OpenAI from "openai";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentConfig {
  name: string;
  role: string;
  systemPrompt: string;
  tools?: ToolDefinition[];
  model?: string;
  maxSteps?: number;
}

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  steps?: number;
  role: string;
}

export class BaseAgent {
  protected config: AgentConfig;
  protected memory: AgentMessage[];
  protected client: OpenAI;

  constructor(config: AgentConfig) {
    this.config = config;
    this.memory = [];
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  get name(): string {
    return this.config.name;
  }

  get role(): string {
    return this.config.role;
  }

  /**
   * Run the agent with a user message, executing tool calls as needed (multi-step reasoning).
   */
  async run(
    userMessage: string,
    context?: Record<string, unknown>
  ): Promise<AgentResponse> {
    const contextualMessage = context
      ? `${userMessage}\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : userMessage;

    this.memory.push({ role: "user", content: contextualMessage });

    const openaiTools = this.config.tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: this.config.systemPrompt },
      ...this.memory,
    ];

    const toolCalls: ToolCall[] = [];
    const maxSteps = this.config.maxSteps ?? 5;
    let steps = 0;

    while (steps < maxSteps) {
      steps++;

      const response = await this.client.chat.completions.create({
        model: this.config.model ?? "gpt-4o-mini",
        messages,
        tools: openaiTools?.length ? openaiTools : undefined,
        tool_choice: openaiTools?.length ? "auto" : undefined,
      });

      const choice = response.choices[0];
      const assistantMessage = choice.message;

      if (
        !assistantMessage.tool_calls ||
        assistantMessage.tool_calls.length === 0
      ) {
        // Final text response
        const content = assistantMessage.content ?? "";
        this.memory.push({ role: "assistant", content });
        return { content, toolCalls, steps, role: this.config.role };
      }

      // Process tool calls
      messages.push(assistantMessage);

      for (const tc of assistantMessage.tool_calls) {
        const toolDef = this.config.tools?.find(
          (t) => t.name === tc.function.name
        );
        let result: unknown = "Tool not found";

        if (toolDef) {
          try {
            const args = JSON.parse(tc.function.arguments || "{}");
            result = await toolDef.execute(args);
          } catch (err: unknown) {
            result = `Tool error: ${err instanceof Error ? err.message : String(err)}`;
          }
        }

        const call: ToolCall = {
          id: tc.id,
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments || "{}"),
          result,
        };
        toolCalls.push(call);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Fallback if max steps hit
    const content = `[${this.config.name}] Max reasoning steps reached.`;
    this.memory.push({ role: "assistant", content });
    return { content, toolCalls, steps, role: this.config.role };
  }

  /** Clear conversation memory */
  clearMemory(): void {
    this.memory = [];
  }

  /** Return a snapshot of current memory */
  getMemory(): AgentMessage[] {
    return [...this.memory];
  }

  start(): void {
    console.log(`${this.config.name} (${this.config.role}) is starting.`);
  }
}

export default BaseAgent;
