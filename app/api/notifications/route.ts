import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export interface Notification {
  id: string;
  type: "generation_complete" | "build_failed" | "build_succeeded" | "security_alert" | "team_change" | "pr_ready";
  title: string;
  message: string;
  read: boolean;
  user_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CreateNotificationRequest {
  type: Notification["type"];
  title: string;
  message: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const unreadOnly = searchParams.get("unread") === "true";

    const supabase = getSupabase();
    if (!supabase) {
      // Return empty list when Supabase is not configured
      return NextResponse.json({ notifications: [], count: 0 });
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (userId) query = query.eq("user_id", userId);
    if (unreadOnly) query = query.eq("read", false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ notifications: data ?? [], count: data?.length ?? 0 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, ...payload } = body as { action?: string } & Record<string, unknown>;

    if (action === "mark_read") {
      const { id, user_id } = payload as { id?: string; user_id?: string };
      const supabase = getSupabase();
      if (supabase && id) {
        await supabase.from("notifications").update({ read: true }).eq("id", id);
        if (user_id) {
          await supabase.from("notifications").update({ read: true }).eq("user_id", user_id);
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "mark_all_read") {
      const { user_id } = payload as { user_id?: string };
      const supabase = getSupabase();
      if (supabase && user_id) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", user_id);
      }
      return NextResponse.json({ ok: true });
    }

    // Default: create notification
    const { type, title, message, user_id, metadata } =
      payload as unknown as CreateNotificationRequest;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title, and message are required" },
        { status: 400 }
      );
    }

    const notification: Omit<Notification, "id"> = {
      type,
      title,
      message,
      read: false,
      user_id,
      metadata,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("notifications")
        .insert(notification)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ notification: data });
    }

    return NextResponse.json({ notification: { ...notification, id: crypto.randomUUID() } });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
