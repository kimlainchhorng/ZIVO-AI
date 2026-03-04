import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Schema drift detection. POST { expected: Record<string, unknown>, actual: Record<string, unknown> } to receive a drift report comparing the two schemas.",
  });
}

interface DriftEntry {
  field: string;
  status: "missing" | "extra" | "type_mismatch";
  expected?: unknown;
  actual?: unknown;
}

function detectDrift(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  prefix = ""
): DriftEntry[] {
  const entries: DriftEntry[] = [];
  const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const inExpected = Object.prototype.hasOwnProperty.call(expected, key);
    const inActual = Object.prototype.hasOwnProperty.call(actual, key);

    if (inExpected && !inActual) {
      entries.push({ field: path, status: "missing", expected: expected[key] });
    } else if (!inExpected && inActual) {
      entries.push({ field: path, status: "extra", actual: actual[key] });
    } else {
      const ev = expected[key];
      const av = actual[key];
      if (
        ev !== null &&
        av !== null &&
        typeof ev === "object" &&
        typeof av === "object" &&
        !Array.isArray(ev) &&
        !Array.isArray(av)
      ) {
        entries.push(
          ...detectDrift(
            ev as Record<string, unknown>,
            av as Record<string, unknown>,
            path
          )
        );
      } else if (typeof ev !== typeof av) {
        entries.push({
          field: path,
          status: "type_mismatch",
          expected: typeof ev,
          actual: typeof av,
        });
      }
    }
  }

  return entries;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const expected = (body.expected ?? {}) as Record<string, unknown>;
    const actual = (body.actual ?? {}) as Record<string, unknown>;

    const drift = detectDrift(expected, actual);
    const hasDrift = drift.length > 0;

    return NextResponse.json({
      hasDrift,
      driftCount: drift.length,
      entries: drift,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
