import OpenAI from "openai";
import { detectFeatures, type FeatureAnalysis } from "./feature-detector";
import { validateOutput } from "./validators/output-validator";
import { AIOutputSchema, type AIOutput } from "./schema";

function getSystemPrompt(analysis: FeatureAnalysis): string {
  return `You are ZIVO AI — the world's most advanced full-stack application generator, like Lovable.dev and Bolt.new combined.

## CRITICAL REQUIREMENT: MINIMUM FILE COUNT
You MUST generate at least ${analysis.minimumFileCount} files. This is NON-NEGOTIABLE.
Detected complexity: ${analysis.complexity}
Detected features: ${analysis.features.join(", ")}

## REQUIRED FILES (you MUST include ALL of these):
${[...analysis.requiredPages, ...analysis.requiredApiRoutes, ...analysis.requiredComponents].map((f) => `- ${f}`).join("\n")}

## STRICT OUTPUT FORMAT
Return ONLY valid JSON (no markdown fences):
{
  "thinking": "your step-by-step analysis",
  "files": [
    { "path": "relative/path/file.tsx", "content": "COMPLETE file content here", "action": "create", "language": "typescript" }
  ],
  "env": ["NEXT_PUBLIC_SUPABASE_URL=", "NEXT_PUBLIC_SUPABASE_ANON_KEY="],
  "routes": ["/", "/dashboard", "/login"],
  "commands": ["npm install", "npx prisma migrate dev"],
  "warnings": [],
  "missing_env": ["OPENAI_API_KEY"],
  "next_steps": ["Set up environment variables", "Run migrations"],
  "summary": "What was built and key decisions"
}

## RULES
1. EVERY file must have COMPLETE content — no placeholders, no "// TODO", no "// ... rest of code"
2. Generate package.json, tailwind.config.ts, tsconfig.json ALWAYS
3. Use TypeScript strict mode — no implicit any
4. Every component handles loading, error, and empty states
5. ALL imports must be present in generated files
6. Make the UI beautiful — use Tailwind, gradients, proper spacing
7. Include README.md with setup instructions
`;
}

export async function generateFullProject(
  prompt: string,
  existingFiles: { path: string; content: string }[] = [],
  model = "gpt-4o"
): Promise<{ output: AIOutput; analysis: FeatureAnalysis; validationResult: ReturnType<typeof validateOutput> }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const analysis = detectFeatures(prompt);
  const systemPrompt = getSystemPrompt(analysis);

  const existingContext =
    existingFiles.length > 0
      ? `\n\nEXISTING FILES (update these, don't recreate from scratch):\n${existingFiles.map((f) => `- ${f.path}`).join("\n")}`
      : "";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt + existingContext },
    ],
    temperature: 0.2,
    max_tokens: 32000,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  let parsed: AIOutput;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    parsed = AIOutputSchema.parse(JSON.parse(cleaned));
  } catch (_parseError) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`AI did not return valid JSON. Received: ${raw.substring(0, 100)}...`);
    try {
      parsed = AIOutputSchema.parse(JSON.parse(match[0]));
    } catch (fallbackError) {
      throw new Error(`Failed to parse AI output: ${(fallbackError as Error).message}`);
    }
  }

  const validationResult = validateOutput(parsed, analysis);

  return { output: parsed, analysis, validationResult };
}
