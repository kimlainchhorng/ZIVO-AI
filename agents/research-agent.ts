// agents/research-agent.ts
import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResearchResult {
  topic: string;
  summary: string;
  sources: string[];
  keyFindings: string[];
  confidence: "high" | "medium" | "low";
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const RESEARCH_SYSTEM_PROMPT = `You are ZIVO Research Agent — an expert at gathering, synthesizing, and presenting technical information.

Your role is to:
1. Analyze the given topic thoroughly
2. Identify key findings, trends, and insights
3. Provide actionable, accurate, and well-structured summaries
4. Cite relevant sources (use real, well-known references when possible)
5. Assess your confidence level based on the breadth of available knowledge

Always respond with valid JSON matching the ResearchResult schema.`;

const COMPARE_SYSTEM_PROMPT = `You are ZIVO Research Agent specializing in technical comparisons.

Compare the provided libraries/frameworks across the specified criteria.
Be objective, data-driven, and provide clear trade-offs.
Always respond with valid JSON matching the ResearchResult schema.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function _parseResult(raw: string, fallbackTopic: string): ResearchResult {
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(clean) as ResearchResult;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as ResearchResult;
    // Fallback: wrap raw text as a low-confidence result
    return {
      topic: fallbackTopic,
      summary: clean.slice(0, 500),
      sources: [],
      keyFindings: [],
      confidence: "low",
    };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function researchTopic(
  topic: string,
  depth: "quick" | "deep" = "quick"
): Promise<ResearchResult> {
  const client = _getClient();
  const model = depth === "deep" ? "o1-mini" : "gpt-4o";

  const userPrompt = `Research the following topic and return a JSON object with fields: topic, summary, sources (array of strings), keyFindings (array of strings), confidence ("high"|"medium"|"low").

Topic: ${topic}
Depth: ${depth}`;

  const response = await client.chat.completions.create({
    model,
    ...(model === "o1-mini" ? {} : { temperature: 0.3 }),
    max_completion_tokens: model === "o1-mini" ? 4000 : undefined,
    max_tokens: model === "o1-mini" ? undefined : 4000,
    messages: [
      { role: "system", content: RESEARCH_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  return _parseResult(raw, topic);
}

export async function compareLibraries(
  libs: string[],
  criteria: string[]
): Promise<ResearchResult> {
  const client = _getClient();

  const userPrompt = `Compare these libraries/frameworks:
Libraries: ${libs.join(", ")}
Criteria: ${criteria.join(", ")}

Return a JSON object with fields: topic, summary, sources (array of strings), keyFindings (array of strings), confidence ("high"|"medium"|"low").
Include specific data points and trade-offs in keyFindings.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 4000,
    messages: [
      { role: "system", content: COMPARE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices?.[0]?.message?.content ?? "{}";
  return _parseResult(raw, `Comparison: ${libs.join(" vs ")}`);
}

// ─── Legacy class export (preserved for backward compatibility) ───────────────

class ResearchAgent {
  async gatherInformation(topic: string): Promise<string> {
    const result = await researchTopic(topic, "quick");
    return result.summary;
  }

  analyzeData(data: unknown): string {
    return `Analyzed data: ${JSON.stringify(data)}`;
  }

  reportFindings(_findings: unknown): void {
    // no-op: production code should not log to console
  }
}

export default ResearchAgent;
