import { NextResponse } from "next/server";
import { generateDatabaseSchema, generateDatabaseFiles } from "@/lib/ai/generators/database-generator";
import { generateAuth } from "@/lib/ai/generators/auth-generator";
import { generateApiRoutes } from "@/lib/ai/generators/api-generator";
import { detectFeatures } from "@/lib/ai/feature-detector";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      prompt: string;
      authProvider?: "supabase" | "nextauth";
      model?: string;
    };
    const { prompt, authProvider = "supabase", model = "gpt-4o" } = body;

    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });

    const analysis = detectFeatures(prompt);
    const allFiles: { path: string; content: string; action: "create" }[] = [];
    const allEnvVars: string[] = [];
    const allCommands: string[] = [];

    // Generate DB schema if needed
    let dbSchema: string | undefined;
    if (analysis.features.includes("database") || analysis.features.includes("saas")) {
      const dbResult = await generateDatabaseSchema(prompt, [], model);
      allFiles.push(...generateDatabaseFiles(dbResult));
      dbSchema = dbResult.prismaSchema;
      allCommands.push("npx prisma generate", "npx prisma migrate dev --name init", "npx prisma db seed");
    }

    // Generate auth if needed
    if (analysis.features.includes("auth") || analysis.features.includes("saas")) {
      const authResult = await generateAuth(authProvider, prompt, model);
      allFiles.push(...authResult.files);
      allEnvVars.push(...authResult.envVars);
      allCommands.push(...authResult.commands);
    }

    // Generate API routes if needed
    if (
      analysis.features.includes("api") ||
      analysis.features.includes("saas") ||
      analysis.features.includes("database")
    ) {
      const resources = analysis.features.includes("ecommerce")
        ? ["products", "orders", "users", "cart"]
        : ["users", "items"];
      const apiResult = await generateApiRoutes(resources, prompt, dbSchema, model);
      allFiles.push(...apiResult.files);
    }

    return NextResponse.json({
      files: allFiles,
      envVars: allEnvVars,
      commands: [...new Set(allCommands)],
      features: analysis.features,
      complexity: analysis.complexity,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
