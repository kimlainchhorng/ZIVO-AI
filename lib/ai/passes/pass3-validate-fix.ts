import OpenAI from "openai";
import type { ProjectBlueprint } from "./pass1-plan";
import type { AIOutput } from "../schema";
import { detectMissingRoutes } from "../fixers/route-fixer";
import { validateOutput } from "../validators/output-validator";
import { detectFeatures } from "../feature-detector";

export interface Pass3Result {
  output: AIOutput;
  fixesApplied: string[];
  remainingIssues: string[];
}

export async function runPass3ValidateFix(
  output: AIOutput,
  blueprint: ProjectBlueprint,
  prompt: string,
  model = "gpt-4o"
): Promise<Pass3Result> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fixesApplied: string[] = [];
  const remainingIssues: string[] = [];

  // Detect missing routes
  const expectedRoutes = blueprint.pages.map(p => p.route)
    .concat(blueprint.apiRoutes.map(r => r.path));
  const routeIssues = detectMissingRoutes(output.files, expectedRoutes);

  if (routeIssues.length > 0) {
    // Ask AI to generate the missing files
    const missingList = routeIssues.map(r => `- ${r.filePath} (for route ${r.route})`).join("\n");

    const fixResponse = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a code fixer. Generate ONLY the missing files listed below as valid JSON array.
Return ONLY: [{ "path": "...", "content": "complete file content", "action": "create", "language": "typescript" }]`,
        },
        {
          role: "user",
          content: `Missing files for: ${prompt}\n\nBlueprint goal: ${blueprint.goal}\n\nGenerate these missing files:\n${missingList}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 16000,
    });

    const raw = fixResponse.choices[0]?.message?.content ?? "[]";
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      const additionalFiles = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(additionalFiles)) {
        output.files.push(...additionalFiles);
        fixesApplied.push(`Added ${additionalFiles.length} missing files: ${routeIssues.map(r => r.route).join(", ")}`);
      }
    } catch {
      remainingIssues.push(`Could not generate missing routes: ${routeIssues.map(r => r.route).join(", ")}`);
    }
  }

  // Validate TypeScript/ESLint issues
  const analysis = detectFeatures(prompt);
  const validation = validateOutput(output, analysis);

  if (!validation.meetsMinimum) {
    remainingIssues.push(`File count ${validation.fileCount} is below minimum ${analysis.minimumFileCount}`);
  }

  return { output, fixesApplied, remainingIssues };
}
