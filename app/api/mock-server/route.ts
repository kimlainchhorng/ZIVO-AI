export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface MockRoute {
  id: string;
  method: string;
  path: string;
  response: unknown;
  statusCode: number;
  delay: number;
  hits: number;
  createdAt: string;
}

const defaultMocks: MockRoute[] = [
  {
    id: "mock_001",
    method: "GET",
    path: "/api/users",
    response: { users: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] },
    statusCode: 200,
    delay: 0,
    hits: 47,
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "mock_002",
    method: "POST",
    path: "/api/auth/login",
    response: { token: "mock_jwt_token_xyz", expiresIn: 3600 },
    statusCode: 200,
    delay: 150,
    hits: 213,
    createdAt: "2026-01-12T08:30:00Z",
  },
  {
    id: "mock_003",
    method: "GET",
    path: "/api/products",
    response: {
      products: [
        { id: "p1", name: "Widget A", price: 9.99 },
        { id: "p2", name: "Widget B", price: 19.99 },
      ],
      total: 2,
    },
    statusCode: 200,
    delay: 50,
    hits: 88,
    createdAt: "2026-02-01T14:00:00Z",
  },
];

const VALID_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export async function GET() {
  try {
    return NextResponse.json({ mocks: defaultMocks });
  } catch {
    return NextResponse.json({ error: "Failed to fetch mock routes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, path, response, statusCode, delay } = body as {
      method?: string;
      path?: string;
      response?: unknown;
      statusCode?: number;
      delay?: number;
    };

    if (!method || !path || response === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: method, path, response" },
        { status: 400 }
      );
    }

    const upperMethod = method.toUpperCase();
    if (!VALID_METHODS.includes(upperMethod)) {
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${VALID_METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    const newMock: MockRoute = {
      id: `mock_${randomUUID().slice(0, 8)}`,
      method: upperMethod,
      path,
      response,
      statusCode: statusCode ?? 200,
      delay: delay ?? 0,
      hits: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ mock: newMock, success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to register mock route" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete mock route" }, { status: 500 });
  }
}
