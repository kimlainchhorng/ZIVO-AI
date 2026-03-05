// agents/web-scraper-agent.ts
import OpenAI from "openai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapeResult {
  url: string;
  title: string;
  description: string;
  mainContent: string;
  codeSnippets: string[];
  links: string[];
  metadata: Record<string, string>;
}

export interface MetadataResult {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  author?: string;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SCRAPE_SYSTEM_PROMPT = `You are ZIVO Web Scraper Agent — an expert at extracting and analyzing web content.

Given a URL, you will:
1. Simulate visiting the page and extracting its content
2. Identify the title, description, main content, code snippets, and links
3. Structure the output as a clean JSON object

Always respond with valid JSON matching the ScrapeResult schema.
If you cannot access the URL, return your best inference based on the URL structure and domain.`;

const METADATA_SYSTEM_PROMPT = `You are ZIVO Metadata Extractor — expert at extracting SEO and Open Graph metadata from web pages.

Given a URL, extract: title, description, keywords (array), ogImage (optional), author (optional).
Always respond with valid JSON matching the MetadataResult schema.`;

const CODE_EXTRACT_SYSTEM_PROMPT = `You are ZIVO Code Extractor — expert at identifying and extracting code examples from web pages.

Given a URL and optional language filter, extract all relevant code snippets.
Return a JSON array of strings, each string being a complete code snippet.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function _parseJson<T>(raw: string, fallback: T): T {
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(clean) as T;
  } catch {
    const match = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// ─── Main class ───────────────────────────────────────────────────────────────

export class WebScraperAgent {
  private client: OpenAI;

  constructor() {
    this.client = _getClient();
  }

  async scrape(url: string): Promise<ScrapeResult> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 3000,
      messages: [
        { role: "system", content: SCRAPE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Scrape and analyze this URL. Return a JSON object with: url, title, description, mainContent, codeSnippets (array), links (array), metadata (object).

URL: ${url}`,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const fallback: ScrapeResult = {
      url,
      title: "",
      description: "",
      mainContent: "",
      codeSnippets: [],
      links: [],
      metadata: {},
    };
    return _parseJson<ScrapeResult>(raw, fallback);
  }

  async extractMetadata(url: string): Promise<MetadataResult> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 1000,
      messages: [
        { role: "system", content: METADATA_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract metadata from this URL. Return JSON with: title, description, keywords (array), ogImage (optional string), author (optional string).

URL: ${url}`,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const fallback: MetadataResult = {
      title: "",
      description: "",
      keywords: [],
    };
    return _parseJson<MetadataResult>(raw, fallback);
  }

  async extractCodeExamples(url: string, language?: string): Promise<string[]> {
    const langHint = language ? ` Focus on ${language} code snippets.` : "";

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 3000,
      messages: [
        { role: "system", content: CODE_EXTRACT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract all code examples from this URL.${langHint} Return a JSON array of strings.

URL: ${url}`,
        },
      ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "[]";
    return _parseJson<string[]>(raw, []);
  }
}

export default WebScraperAgent;