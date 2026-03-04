import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface DomainRecord {
  type: "A" | "CNAME" | "MX" | "TXT";
  name: string;
  value: string;
  ttl?: number;
}

export interface DomainInfo {
  domain: string;
  available: boolean;
  records: DomainRecord[];
  sslStatus: "active" | "pending" | "inactive";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  const info: DomainInfo = {
    domain,
    available: true,
    records: [
      { type: "A", name: "@", value: "76.76.21.21", ttl: 300 },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com", ttl: 300 },
    ],
    sslStatus: "pending",
  };

  return NextResponse.json(info);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as {
    domain?: string;
    records?: DomainRecord[];
  };

  const { domain, records } = body;

  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  return NextResponse.json({
    domain,
    records: records ?? [],
    message: `DNS records for ${domain} queued for update`,
    sslStatus: "pending",
  });
}
