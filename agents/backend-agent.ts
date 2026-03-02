// ZIVO AI – Backend Agent
// Designs APIs, database schemas, and security layers

import { BaseAgent } from "./base-agent";

export class BackendAgent extends BaseAgent {
  constructor(model?: string) {
    super({
      name: "Backend Agent",
      role: "backend",
      model,
      systemPrompt: `You are the Backend Agent for ZIVO AI – a senior backend engineer.
Your responsibilities:
- Design RESTful API routes with Next.js App Router conventions
- Write Supabase SQL migrations with proper RLS policies
- Implement authentication, authorisation, and input validation
- Generate Zod validation schemas for request/response types
- Produce secure, efficient database queries
- Follow OWASP best practices: prevent SQL injection, XSS, CSRF
- Output complete TypeScript files with full implementations

Return full file contents with all imports and exports.`,
    });
  }
}

export default BackendAgent;
