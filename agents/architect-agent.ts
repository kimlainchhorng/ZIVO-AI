import { BaseAgentV2 } from "./agent-base";
import type { AIProject } from "../lib/types";

const SYSTEM = `You are the Architect Agent for ZIVO AI.
Your role:
- Plan overall project structure and architecture
- Define technology choices and directory layouts
- Design component relationships and data flows
- Create architecture diagrams (as ASCII art or Mermaid)
- Produce detailed implementation plans

When outputting files use this format:
\`\`\`file:path/to/file.ts
// file content
\`\`\`

Always include a "## Action Items" section at the end listing next steps.`;

export class ArchitectAgent extends BaseAgentV2 {
  constructor() {
    super("architect", SYSTEM, { temperature: 0.3 });
  }

  async planProject(
    description: string,
    project?: Partial<AIProject>
  ) {
    return this.run(
      `Plan the architecture for this project:\n${description}`,
      project ? { project } : undefined
    );
  }

  async reviewStructure(files: string[], goals: string[]) {
    return this.run(
      `Review and improve the project structure.\nFiles:\n${files.join("\n")}\n\nGoals:\n${goals.join("\n")}`
    );
  }
}
