// Documentation generator — uses OpenAI gpt-4o-mini to produce project docs from generated files.

import OpenAI from "openai";

export interface GeneratedFile {
  path: string;
  content: string;
  action?: string;
}

export interface DocOutput {
  readme: string;
  apiDocs: string;
  componentDocs: string;
  setupGuide: string;
}

// Truncation limit for file content previews sent to the LLM.
const CONTENT_PREVIEW_LENGTH = 400;

function getClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function _generateSection(
  client: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

function _buildFilesSummary(files: GeneratedFile[]): string {
  return files
    .slice(0, 20)
    .map((f) => `### ${f.path}\n${f.content.slice(0, CONTENT_PREVIEW_LENGTH)}${f.content.length > CONTENT_PREVIEW_LENGTH ? "\n..." : ""}`)
    .join("\n\n");
}

function _getApiRoutes(files: GeneratedFile[]): GeneratedFile[] {
  return files.filter((f) => f.path.includes("app/api") && f.path.endsWith("route.ts"));
}

function _getComponents(files: GeneratedFile[]): GeneratedFile[] {
  return files.filter(
    (f) =>
      (f.path.includes("components/") || f.path.includes("app/")) &&
      (f.path.endsWith(".tsx") || f.path.endsWith(".jsx")) &&
      !f.path.includes("layout") &&
      !f.path.includes("page")
  );
}

function _placeholderDocs(projectName: string): DocOutput {
  return {
    readme: `# ${projectName}\n\nAdd a project description here.\n\n## Installation\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
    apiDocs: `# API Documentation\n\nDocument your API routes here.\n`,
    componentDocs: `# Component Documentation\n\nDocument your components here.\n`,
    setupGuide: `# Setup Guide\n\n1. Copy \`.env.example\` to \`.env.local\`\n2. Fill in the required environment variables\n3. Run \`npm install && npm run dev\`\n`,
  };
}

export async function generateDocumentation(
  files: GeneratedFile[],
  projectName: string
): Promise<DocOutput> {
  if (!process.env.OPENAI_API_KEY) {
    return _placeholderDocs(projectName);
  }

  const client = getClient();
  const filesSummary = _buildFilesSummary(files);
  const apiRoutes = _getApiRoutes(files);
  const components = _getComponents(files);

  const apiRoutesSummary = apiRoutes
    .map((f) => `### ${f.path}\n${f.content.slice(0, CONTENT_PREVIEW_LENGTH * 1.5)}`)
    .join("\n\n");

  const componentSummary = components
    .map((f) => `### ${f.path}\n${f.content.slice(0, CONTENT_PREVIEW_LENGTH)}`)
    .join("\n\n");

  try {
    const [readme, apiDocs, componentDocs, setupGuide] = await Promise.all([
      _generateSection(
        client,
        "You are a technical writer. Write a professional GitHub README in Markdown.",
        `Project name: ${projectName}\n\nFiles:\n${filesSummary}\n\nWrite a README with: project description, key features, installation steps, and basic usage. Keep it concise.`
      ),
      apiRoutes.length > 0
        ? _generateSection(
            client,
            "You are a technical writer. Document REST API routes in Markdown.",
            `Project: ${projectName}\n\nAPI routes:\n${apiRoutesSummary}\n\nDocument each route with: method, path, request body, response shape, and a short description.`
          )
        : Promise.resolve("# API Documentation\n\nNo API routes found in this project.\n"),
      components.length > 0
        ? _generateSection(
            client,
            "You are a technical writer. Document React components in Markdown.",
            `Project: ${projectName}\n\nComponents:\n${componentSummary}\n\nList each component with its name, purpose, and key props.`
          )
        : Promise.resolve("# Component Documentation\n\nNo components found in this project.\n"),
      _generateSection(
        client,
        "You are a technical writer. Write a setup guide in Markdown.",
        `Project: ${projectName}\n\nFiles:\n${filesSummary}\n\nWrite a getting-started guide covering: required environment variables, installation commands, and first-run instructions.`
      ),
    ]);

    return { readme, apiDocs, componentDocs, setupGuide };
  } catch {
    return _placeholderDocs(projectName);
  }
}
