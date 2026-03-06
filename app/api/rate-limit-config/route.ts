import { NextResponse } from "next/server";
import {
  setEndpointConfig,
  listEndpointConfigs,
  getEndpointConfig,
  type EndpointRateLimitConfig,
} from "../../../lib/rate-limiter";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint");

  if (endpoint) {
    const config = getEndpointConfig(endpoint);
    if (!config) {
      return NextResponse.json({ error: `No config found for endpoint: ${endpoint}` }, { status: 404 });
    }
    return NextResponse.json({ config });
  }

  return NextResponse.json({ configs: listEndpointConfigs() });
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { endpoint, limit, windowMs } = body as Partial<EndpointRateLimitConfig>;

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }
    if (!limit || typeof limit !== "number" || limit < 1) {
      return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
    }
    if (!windowMs || typeof windowMs !== "number" || windowMs < 1000) {
      return NextResponse.json({ error: "windowMs must be at least 1000" }, { status: 400 });
    }

    const config: EndpointRateLimitConfig = { endpoint, limit, windowMs };
    setEndpointConfig(config);
    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
