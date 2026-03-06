// GET  /api/projects/[id]/design-tokens — fetch tokens (or SaaS defaults)
// PUT  /api/projects/[id]/design-tokens — upsert tokens
// POST /api/projects/[id]/design-tokens — same as PUT (alias)

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import {
  extractBearerToken,
  getUserFromToken,
  getProjectDesignTokens,
  upsertProjectDesignTokens,
} from '@/lib/db/projects-db';
import { generateTokensCss, generateTokensTs } from '@/lib/design-tokens-css';
import type { ProjectDesignTokens } from '@/lib/design-tokens-schema';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tokens = await getProjectDesignTokens(token, id);

    // Optional ?format=css|ts query param for direct file generation
    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    if (format === 'css') {
      return new Response(generateTokensCss(tokens), {
        headers: { 'Content-Type': 'text/css; charset=utf-8' },
      });
    }
    if (format === 'ts') {
      return new Response(generateTokensTs(tokens), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return NextResponse.json({ tokens });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to fetch design tokens' },
      { status: 500 }
    );
  }
}

async function handleUpsertDesignTokens(req: Request, id: string) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tokens } = body as { tokens?: ProjectDesignTokens };
  if (!tokens || typeof tokens !== 'object') {
    return NextResponse.json({ error: '"tokens" field is required' }, { status: 400 });
  }

  try {
    const row = await upsertProjectDesignTokens(token, id, tokens);
    return NextResponse.json({ tokens: row.tokens_json });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Failed to save design tokens' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  const { id } = await params;
  return handleUpsertDesignTokens(req, id);
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  return handleUpsertDesignTokens(req, id);
}
