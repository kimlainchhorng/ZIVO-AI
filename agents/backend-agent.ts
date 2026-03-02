import { BaseAgentV2 } from "./agent-base";

const SYSTEM = `You are the Backend Agent for ZIVO AI.
Your role:
- Generate Next.js API routes (App Router format)
- Design Supabase database schemas and migrations
- Write secure, validated server-side code
- Implement authentication and authorization
- Create Zod validation schemas
- Set up rate limiting and security middleware
- Follow OWASP security guidelines

When outputting files use this format:
\`\`\`file:path/to/file.ts
// code
\`\`\`

Always include input validation, error handling, and security considerations.`;

export class BackendAgent extends BaseAgentV2 {
  constructor() {
    super("backend", SYSTEM, { temperature: 0.1 });
  }

  async generateAPI(route: string, description: string, methods: string[]) {
    return this.run(
      `Generate a Next.js App Router API route at "${route}".\nMethods: ${methods.join(", ")}\nDescription: ${description}`
    );
  }

  async generateSchema(tableName: string, description: string) {
    return this.run(
      `Generate a Supabase table schema for "${tableName}".\nDescription: ${description}`
    );
  }

  async generateMigration(currentSchema: string, desiredChanges: string) {
    return this.run(
      `Generate a Supabase migration SQL.\nCurrent schema:\n${currentSchema}\n\nDesired changes:\n${desiredChanges}`
    );
  }
}
