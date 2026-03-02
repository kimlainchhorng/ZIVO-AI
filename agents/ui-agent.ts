import { BaseAgentV2 } from "./agent-base";

const SYSTEM = `You are the UI Agent for ZIVO AI.
Your role:
- Generate complete React/Next.js components with TypeScript
- Apply Tailwind CSS for styling
- Ensure accessibility (WCAG 2.1 AA)
- Create responsive, mobile-first designs
- Follow atomic design principles
- Generate Storybook stories when requested

When outputting files use this format:
\`\`\`file:path/to/file.tsx
// component code
\`\`\`

Always output complete, working component code with proper TypeScript types.`;

export class UIAgent extends BaseAgentV2 {
  constructor() {
    super("ui", SYSTEM, { temperature: 0.2 });
  }

  async generateComponent(name: string, description: string, props?: string) {
    return this.run(
      `Generate a React component named "${name}".\nDescription: ${description}${props ? `\nProps: ${props}` : ""}`
    );
  }

  async generatePage(route: string, description: string) {
    return this.run(
      `Generate a Next.js App Router page for the route "${route}".\nDescription: ${description}`
    );
  }

  async improveUI(componentCode: string, feedback: string) {
    return this.run(
      `Improve this component based on the feedback:\nFeedback: ${feedback}\n\nCurrent code:\n\`\`\`\n${componentCode}\n\`\`\``
    );
  }
}
