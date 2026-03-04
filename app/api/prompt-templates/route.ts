import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface PromptTemplateAction {
  action: "create" | "update" | "delete" | "list";
  template?: {
    id?: string;
    name: string;
    content: string;
    category: string;
  };
}

const sampleTemplates: PromptTemplate[] = [
  {
    id: "tpl_001",
    name: "Code Review",
    content:
      "Review the following code for bugs, performance issues, and best practices:\n\n{{code}}",
    category: "engineering",
  },
  {
    id: "tpl_002",
    name: "PRD Draft",
    content:
      "Write a Product Requirements Document for the following feature:\n\n{{feature_description}}",
    category: "product",
  },
  {
    id: "tpl_003",
    name: "Unit Test Generator",
    content:
      "Generate unit tests for the following function using Jest:\n\n{{function_code}}",
    category: "testing",
  },
  {
    id: "tpl_004",
    name: "SQL Query Optimizer",
    content:
      "Analyze and optimize the following SQL query for performance:\n\n{{sql_query}}",
    category: "database",
  },
  {
    id: "tpl_005",
    name: "API Documentation",
    content:
      "Generate OpenAPI documentation for the following endpoint:\n\n{{endpoint_code}}",
    category: "documentation",
  },
];

export async function GET() {
  return NextResponse.json({
    description:
      "CRUD API for prompt templates. Supports list, create, update, and delete actions via POST.",
    templates: sampleTemplates,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as PromptTemplateAction;

    const { action, template } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    switch (action) {
      case "list":
        return NextResponse.json({ templates: sampleTemplates });

      case "create": {
        if (!template?.name || !template?.content || !template?.category) {
          return NextResponse.json(
            { error: "Template must include name, content, and category" },
            { status: 400 }
          );
        }
        const newTemplate: PromptTemplate = {
          id: `tpl_${Date.now()}`,
          name: template.name,
          content: template.content,
          category: template.category,
        };
        return NextResponse.json(
          { message: "Template created", template: newTemplate },
          { status: 201 }
        );
      }

      case "update": {
        if (!template?.id) {
          return NextResponse.json(
            { error: "Template id is required for update" },
            { status: 400 }
          );
        }
        if (!template?.name || !template?.content || !template?.category) {
          return NextResponse.json(
            { error: "Template must include name, content, and category" },
            { status: 400 }
          );
        }
        const updatedTemplate: PromptTemplate = {
          id: template.id,
          name: template.name,
          content: template.content,
          category: template.category,
        };
        return NextResponse.json({
          message: "Template updated",
          template: updatedTemplate,
        });
      }

      case "delete": {
        if (!template?.id) {
          return NextResponse.json(
            { error: "Template id is required for delete" },
            { status: 400 }
          );
        }
        return NextResponse.json({
          message: `Template ${template.id} deleted`,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be one of: create, update, delete, list" },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
