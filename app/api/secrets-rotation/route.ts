import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Secrets rotation API (mock Vault integration). POST { secretName: string, rotationSchedule: string }",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const secretName = typeof body.secretName === "string" ? body.secretName : "";
    const rotationSchedule =
      typeof body.rotationSchedule === "string" ? body.rotationSchedule : "30d";

    if (!secretName) {
      return NextResponse.json({ error: "secretName is required" }, { status: 400 });
    }

    const rotationConfig = {
      secretName,
      rotationSchedule,
      vaultPath: `secret/data/${secretName}`,
      lastRotated: new Date().toISOString(),
      nextRotation: new Date(
        Date.now() + parseDurationMs(rotationSchedule)
      ).toISOString(),
      status: "scheduled",
      vaultIntegration: "mock",
    };

    return NextResponse.json(rotationConfig);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseDurationMs(schedule: string): number {
  const match = /^(\d+)(d|h|m)$/.exec(schedule);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "d") return value * 24 * 60 * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return value * 60 * 1000;
}
