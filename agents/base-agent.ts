// ZIVO AI – Base Agent

export interface AgentOptions {
  name: string;
  role: string;
  systemPrompt: string;
  model?: string;
}

export class BaseAgent {
  name: string;
  role: string;
  systemPrompt: string;
  model: string;

  constructor(options: AgentOptions) {
    this.name = options.name;
    this.role = options.role;
    this.systemPrompt = options.systemPrompt;
    this.model = options.model ?? "gpt-4.1-mini";
  }

  start() {
    console.log(`[${this.role}] ${this.name} is starting.`);
  }

  /** Build the messages array for OpenAI chat completions */
  buildMessages(userPrompt: string, context?: string) {
    const systemContent = context
      ? `${this.systemPrompt}\n\nContext:\n${context}`
      : this.systemPrompt;

    return [
      { role: "system" as const, content: systemContent },
      { role: "user" as const, content: userPrompt },
    ];
  }
}

export default BaseAgent;