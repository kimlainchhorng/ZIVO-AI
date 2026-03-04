import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export interface AnalyticsEvent {
  event_type: string;
  feature: string;
  model?: string;
  tokens_used?: number;
  response_time_ms?: number;
  success: boolean;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

export interface TrackAnalyticsRequest {
  event: AnalyticsEvent;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { event }: TrackAnalyticsRequest = body;

    if (!event || typeof event !== "object") {
      return NextResponse.json({ error: "Missing event object" }, { status: 400 });
    }

    if (!event.event_type || !event.feature) {
      return NextResponse.json(
        { error: "event_type and feature are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("analytics").insert({
        event_type: event.event_type,
        feature: event.feature,
        model: event.model ?? null,
        tokens_used: event.tokens_used ?? null,
        response_time_ms: event.response_time_ms ?? null,
        success: event.success,
        user_id: event.user_id ?? null,
        metadata: event.metadata ?? null,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, tracked: true });
  } catch (err: unknown) {
    // Analytics tracking failures are non-critical — return 200 to avoid
    // breaking the caller's flow
    return NextResponse.json({
      ok: false,
      error: (err as Error)?.message ?? "Tracking error",
    });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({
    endpoints: {
      POST: "Track an analytics event",
    },
    schema: {
      event: {
        event_type: "string (required)",
        feature: "string (required)",
        model: "string (optional)",
        tokens_used: "number (optional)",
        response_time_ms: "number (optional)",
        success: "boolean (required)",
        user_id: "string (optional)",
        metadata: "object (optional)",
      },
    },
  });
}
