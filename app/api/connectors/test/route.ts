export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type ConnectorType = "github" | "supabase" | "stripe" | "resend";

interface TestRequestBody {
  type: ConnectorType;
  credentials: Record<string, string>;
}

interface TestResult {
  success: boolean;
  message: string;
  data?: unknown;
}

async function testGithub(credentials: Record<string, string>): Promise<TestResult> {
  const { token } = credentials;
  if (!token) return { success: false, message: "Missing required field: token" };

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg = typeof body.message === "string" ? body.message : "Authentication failed";
    return { success: false, message: `GitHub: ${msg}` };
  }

  const user = await res.json() as Record<string, unknown>;
  return {
    success: true,
    message: `Connected as ${String(user.login)}`,
    data: { login: user.login, name: user.name, avatar_url: user.avatar_url },
  };
}

async function testSupabase(credentials: Record<string, string>): Promise<TestResult> {
  const { url, anonKey } = credentials;
  if (!url) return { success: false, message: "Missing required field: url" };
  if (!anonKey) return { success: false, message: "Missing required field: anonKey" };

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (res.status === 200 || res.status === 404) {
    // 404 is acceptable — it means the REST API is reachable but no tables matched
    return { success: true, message: "Supabase project reachable", data: { status: res.status } };
  }

  return { success: false, message: `Supabase returned status ${res.status}` };
}

async function testStripe(credentials: Record<string, string>): Promise<TestResult> {
  const { secretKey } = credentials;
  if (!secretKey) return { success: false, message: "Missing required field: secretKey" };

  const res = await fetch("https://api.stripe.com/v1/account", {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    const msg = body.error?.message ?? "Authentication failed";
    return { success: false, message: `Stripe: ${msg}` };
  }

  const account = await res.json() as Record<string, unknown>;
  return {
    success: true,
    message: `Connected to Stripe account ${String(account.id)}`,
    data: { id: account.id, email: account.email },
  };
}

async function testResend(credentials: Record<string, string>): Promise<TestResult> {
  const { apiKey } = credentials;
  if (!apiKey) return { success: false, message: "Missing required field: apiKey" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (res.status === 401) {
    return { success: false, message: "Resend: Invalid API key" };
  }

  return { success: true, message: "Resend API key is valid", data: { status: res.status } };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: TestRequestBody;

  try {
    body = (await req.json()) as TestRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { type, credentials } = body;

  if (!type || !credentials || typeof credentials !== "object") {
    return NextResponse.json(
      { success: false, message: "Request must include 'type' and 'credentials'" },
      { status: 400 }
    );
  }

  try {
    let result: TestResult;

    switch (type) {
      case "github":
        result = await testGithub(credentials);
        break;
      case "supabase":
        result = await testSupabase(credentials);
        break;
      case "stripe":
        result = await testStripe(credentials);
        break;
      case "resend":
        result = await testResend(credentials);
        break;
      default:
        return NextResponse.json(
          { success: false, message: `Unknown connector type: ${String(type)}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return NextResponse.json(
      { success: false, message: `Network error: ${message}` },
      { status: 500 }
    );
  }
}
