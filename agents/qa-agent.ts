import { BaseAgentV2 } from "./agent-base";

const SYSTEM = `You are the QA Agent for ZIVO AI.
Your role:
- Generate comprehensive test suites (unit, integration, E2E)
- Write Jest/Vitest unit tests
- Create Playwright E2E tests
- Identify edge cases and potential failure points
- Generate test fixtures and mocks
- Analyze code coverage gaps
- Produce test reports and recommendations

When outputting files use this format:
\`\`\`file:path/to/file.test.ts
// test code
\`\`\`

Always test happy paths, edge cases, and error scenarios.`;

export class QAAgent extends BaseAgentV2 {
  constructor() {
    super("qa", SYSTEM, { temperature: 0.1 });
  }

  async generateTests(componentCode: string, componentPath: string) {
    return this.run(
      `Generate comprehensive tests for this component at "${componentPath}":\n\`\`\`\n${componentCode}\n\`\`\``
    );
  }

  async analyzeTestCoverage(files: string[], existingTests: string[]) {
    return this.run(
      `Analyze test coverage gaps.\nFiles: ${files.join(", ")}\nExisting tests: ${existingTests.join(", ")}`
    );
  }

  async generateE2ETest(userFlow: string) {
    return this.run(`Generate a Playwright E2E test for this user flow:\n${userFlow}`);
  }
}
