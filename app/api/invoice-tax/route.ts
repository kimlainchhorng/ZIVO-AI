import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Invoice and tax configuration generator. Accepts { country: string, taxType: string, rate: number } and returns a tax configuration object for use in invoicing systems.",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      country?: string;
      taxType?: string;
      rate?: number;
    };

    const { country, taxType, rate } = body;

    if (!country || !taxType || rate === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: country, taxType, and rate" },
        { status: 400 }
      );
    }

    if (typeof rate !== "number" || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: "rate must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    const taxConfig = {
      country,
      taxType,
      rate,
      rateDecimal: rate / 100,
      displayName: `${taxType} (${rate}%)`,
      inclusive: false,
      stripe: {
        tax_rate: {
          display_name: taxType,
          inclusive: false,
          percentage: rate,
          country: country.toUpperCase().slice(0, 2),
          active: true,
        },
      },
      invoiceLineItem: {
        description: `${taxType} @ ${rate}%`,
        taxBehavior: "exclusive",
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ taxConfig });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
