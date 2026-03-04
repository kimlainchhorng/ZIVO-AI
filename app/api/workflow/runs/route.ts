import { NextResponse } from "next/server";
import { workflowRuns } from "../store";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return NextResponse.json(workflowRuns.slice(0, 50));
}
