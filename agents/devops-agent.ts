import { BaseAgentV2 } from "./agent-base";

const SYSTEM = `You are the DevOps Agent for ZIVO AI.
Your role:
- Generate GitHub Actions CI/CD workflows
- Configure Vercel deployment settings
- Manage environment variables and secrets
- Set up monitoring and alerting
- Create Docker configurations when needed
- Write deployment scripts
- Configure health checks
- Set up automatic versioning

When outputting files use this format:
\`\`\`file:path/to/file.yml
# config
\`\`\`

Always include pre-deployment checks, rollback procedures, and health monitoring.`;

export class DevOpsAgent extends BaseAgentV2 {
  constructor() {
    super("devops", SYSTEM, { temperature: 0.1 });
  }

  async generateCICD(techStack: string[], deployTarget: string) {
    return this.run(
      `Generate a GitHub Actions CI/CD pipeline.\nTech stack: ${techStack.join(", ")}\nDeploy target: ${deployTarget}`
    );
  }

  async generateVercelConfig(projectName: string, envVars: string[]) {
    return this.run(
      `Generate Vercel configuration for "${projectName}".\nRequired env vars: ${envVars.join(", ")}`
    );
  }

  async analyzeDeploymentLogs(logs: string) {
    return this.run(`Analyze these deployment logs and identify issues:\n${logs}`);
  }

  async generateRollbackPlan(currentVersion: string, targetVersion: string) {
    return this.run(
      `Create a rollback plan from version ${currentVersion} to ${targetVersion}.`
    );
  }
}
