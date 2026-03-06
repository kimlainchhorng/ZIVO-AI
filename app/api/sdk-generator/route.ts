export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type SupportedLanguage = "typescript" | "python" | "curl" | "javascript";

const VALID_LANGUAGES: SupportedLanguage[] = ["typescript", "python", "curl", "javascript"];

const SDK_FILENAMES: Record<SupportedLanguage, string> = {
  typescript: "zivo-sdk.ts",
  python: "zivo_sdk.py",
  curl: "zivo-examples.sh",
  javascript: "zivo-sdk.js",
};

const SDK_INSTRUCTIONS: Record<SupportedLanguage, string> = {
  typescript:
    "Install dependencies: `npm install`. Set ZIVO_API_KEY in your environment. Import ZivoClient and call the desired methods.",
  python:
    "Install dependencies: `pip install httpx`. Set ZIVO_API_KEY as an environment variable. Run with `python zivo_sdk.py`.",
  curl: "Set ZIVO_API_KEY env var: `export ZIVO_API_KEY=your_key`. Make the script executable: `chmod +x zivo-examples.sh`. Run: `./zivo-examples.sh`.",
  javascript:
    "Set ZIVO_API_KEY in your environment. Run with `node zivo-sdk.js`. Requires Node.js 18+.",
};

const generateCode: Record<SupportedLanguage, (endpoints: string[]) => string> = {
  typescript: (endpoints) => `
import fetch from "node:fetch";

const BASE_URL = "https://api.zivo.ai/v1";
const API_KEY = process.env.ZIVO_API_KEY ?? "";

interface ZivoResponse<T> {
  data: T;
  success: boolean;
}

class ZivoClient {
  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${apiKey}\`,
    };
  }

  async get<T>(path: string): Promise<ZivoResponse<T>> {
    const res = await fetch(\`\${BASE_URL}\${path}\`, { headers: this.headers });
    if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
    return res.json() as Promise<ZivoResponse<T>>;
  }

  async post<T>(path: string, body: unknown): Promise<ZivoResponse<T>> {
    const res = await fetch(\`\${BASE_URL}\${path}\`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
    return res.json() as Promise<ZivoResponse<T>>;
  }

${endpoints
  .map((ep) => {
    const name = ep.replace(/\//g, "_").replace(/^_/, "");
    return `  async ${name}(params?: unknown) { return this.get(\`${ep}\`); }`;
  })
  .join("\n")}
}

export const client = new ZivoClient(API_KEY);
`.trim(),

  python: (endpoints) => `
import os
import httpx
from typing import Any

BASE_URL = "https://api.zivo.ai/v1"
API_KEY = os.getenv("ZIVO_API_KEY", "")

class ZivoClient:
    def __init__(self, api_key: str) -> None:
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        self.client = httpx.Client(base_url=BASE_URL, headers=self.headers)

    def get(self, path: str) -> dict[str, Any]:
        response = self.client.get(path)
        response.raise_for_status()
        return response.json()

    def post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        response = self.client.post(path, json=body)
        response.raise_for_status()
        return response.json()

${endpoints
  .map((ep) => {
    const name = ep.replace(/\//g, "_").replace(/^_/, "");
    return `    def ${name}(self, params: dict | None = None) -> dict[str, Any]:\n        return self.get("${ep}")`;
  })
  .join("\n\n")}

client = ZivoClient(API_KEY)
`.trim(),

  curl: (endpoints) => `
#!/usr/bin/env bash
# ZIVO AI – cURL examples
BASE_URL="https://api.zivo.ai/v1"
API_KEY="\${ZIVO_API_KEY}"

${endpoints
  .map(
    (ep) => `# ${ep}
curl -s -X GET "\\$BASE_URL${ep}" \\
  -H "Authorization: Bearer \\$API_KEY" \\
  -H "Content-Type: application/json" | jq .
`
  )
  .join("\n")}

# Run an agent
curl -s -X POST "\\$BASE_URL/agent-run" \\
  -H "Authorization: Bearer \\$API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"agentName":"researcher","task":"Summarize ZIVO docs"}' | jq .
`.trim(),

  javascript: (endpoints) => `
const BASE_URL = "https://api.zivo.ai/v1";
const API_KEY = process.env.ZIVO_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  Authorization: \`Bearer \${API_KEY}\`,
};

async function zivoGet(path) {
  const res = await fetch(\`\${BASE_URL}\${path}\`, { headers });
  if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
  return res.json();
}

async function zivoPost(path, body) {
  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
  return res.json();
}

${endpoints
  .map((ep) => {
    const name = ep.replace(/\//g, "_").replace(/^_/, "");
    return `export const ${name} = (params) => zivoGet("${ep}");`;
  })
  .join("\n")}
`.trim(),
};

const DEFAULT_ENDPOINTS = [
  "/health",
  "/agent-run",
  "/prompt-library",
  "/knowledge-base",
  "/snapshots",
  "/rbac",
  "/migrate",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language, endpoints } = body as {
      language?: string;
      endpoints?: string[];
    };

    if (!language) {
      return NextResponse.json({ error: "Missing required field: language" }, { status: 400 });
    }

    if (!VALID_LANGUAGES.includes(language as SupportedLanguage)) {
      return NextResponse.json(
        {
          error: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const lang = language as SupportedLanguage;
    const resolvedEndpoints = Array.isArray(endpoints) && endpoints.length > 0
      ? endpoints
      : DEFAULT_ENDPOINTS;

    return NextResponse.json({
      code: generateCode[lang](resolvedEndpoints),
      language: lang,
      filename: SDK_FILENAMES[lang],
      instructions: SDK_INSTRUCTIONS[lang],
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate SDK" }, { status: 500 });
  }
}
