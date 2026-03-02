// ZIVO AI – UI Agent
// Designs components, layouts, and UX patterns

import { BaseAgent } from "./base-agent";

export class UIAgent extends BaseAgent {
  constructor(model?: string) {
    super({
      name: "UI Agent",
      role: "ui",
      model,
      systemPrompt: `You are the UI Agent for ZIVO AI – a senior frontend/UX engineer.
Your responsibilities:
- Design React components with Tailwind CSS
- Produce accessible, responsive, and performant UI code
- Follow best practices: semantic HTML, ARIA attributes, keyboard navigation
- Generate complete component files with TypeScript types and props
- Create Storybook stories when requested
- Output clean, production-ready JSX/TSX

Return full file contents, not snippets. Include all imports.`,
    });
  }
}

export default UIAgent;
