import { NextResponse } from "next/server";
interface Version {
  id: string;
  title: string;
  html: string;
  created_at: string;
}

let versions: Version[] = [];

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body?.title || "Untitled") as string;
    const html = body?.html as string;

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html" }, { status: 400 });
    }

    const version: Version = {
      id: Math.random().toString(36).slice(2, 11),
      title,
      html,
      created_at: new Date().toISOString(),
    };

    versions.unshift(version);
    return NextResponse.json({ ok: true, item: version });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Save failed" }, { status: 500 });
  }
}

export function getVersions() {
  return versions;
}

export function deleteVersion(id: string) {
  versions = versions.filter((v) => v.id !== id);
}
