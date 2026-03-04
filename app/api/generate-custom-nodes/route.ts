import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Custom workflow node generator. Accepts { nodeName: string, inputs: string[], outputs: string[], logic: string } and returns generated node code ready for a workflow engine.",
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      nodeName?: string;
      inputs?: string[];
      outputs?: string[];
      logic?: string;
    };

    const { nodeName, inputs, outputs, logic } = body;

    if (!nodeName || !inputs || !outputs || !logic) {
      return NextResponse.json(
        { error: "Missing required fields: nodeName, inputs, outputs, and logic" },
        { status: 400 }
      );
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a workflow automation expert specializing in React Flow and LangChain custom nodes. Generate a complete, typed TypeScript custom node component with proper input/output handle definitions, execution logic, and a matching LangChain tool class. Include brief inline comments.",
        },
        {
          role: "user",
          content: JSON.stringify({ nodeName, inputs, outputs, logic }),
        },
      ],
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
