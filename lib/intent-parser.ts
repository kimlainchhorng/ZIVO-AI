// lib/intent-parser.ts — Smart prompt intent extraction using GPT-4o

import OpenAI from "openai";

export interface ParsedIntent {
  appType: string;      // e.g. "Dashboard", "Landing Page", "E-commerce"
  pages: string[];      // e.g. ["/dashboard", "/trips", "/profile"]
  components: string[]; // e.g. ["Navbar", "StatsCard", "TripTable"]
  database: string[];   // e.g. ["drivers", "trips", "payouts"]
  features: string[];   // e.g. ["auth", "charts", "realtime"]
  designTheme: string;  // e.g. "dark", "light", "glassmorphism"
  framework: string;    // always "Next.js"
}

const INTENT_SYSTEM_PROMPT = `You are a software architect AI. Analyze the user's natural-language prompt and extract structured intent for a web application.

Return ONLY a valid JSON object matching this schema (no markdown fences, no extra text):
{
  "appType": "Dashboard | Landing Page | E-commerce | SaaS | Portfolio | Blog | Admin Panel | Mobile App | Other",
  "pages": ["/", "/dashboard", "/profile"],
  "components": ["Navbar", "StatsCard", "DataTable"],
  "database": ["users", "products", "orders"],
  "features": ["auth", "charts", "realtime", "payments", "search", "notifications"],
  "designTheme": "dark | light | glassmorphism | minimal | colorful",
  "framework": "Next.js"
}

Rules:
- appType must be a single concise label
- pages must be URL paths (start with /)
- components must be PascalCase React component names
- database must be lowercase table names (snake_case if multi-word)
- features must be lowercase identifiers from the provided list or similar
- designTheme must be a single word
- framework is always "Next.js"
- Return ONLY the JSON object`;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Parses a user's natural-language prompt and extracts structured intent
 * before any code is generated.
 */
export async function parseIntent(prompt: string): Promise<ParsedIntent> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    max_tokens: 1024,
    messages: [
      { role: "system", content: INTENT_SYSTEM_PROMPT },
      { role: "user", content: `Parse the intent from this prompt:\n\n${prompt}` },
    ],
  });

  const rawText = response.choices?.[0]?.message?.content ?? "";

  let parsed: ParsedIntent;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText) as ParsedIntent;
  } catch {
    // Return a reasonable fallback
    parsed = {
      appType: "Web Application",
      pages: ["/"],
      components: ["Navbar", "Footer"],
      database: [],
      features: [],
      designTheme: "dark",
      framework: "Next.js",
    };
  }

  // Ensure framework is always "Next.js"
  parsed.framework = "Next.js";

  return parsed;
}
