import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MIN_PER_PAGE = 1;
const MAX_PER_PAGE = 100;
const DEFAULT_PER_PAGE = 5;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const perPageRaw = parseInt(searchParams.get('per_page') ?? String(DEFAULT_PER_PAGE), 10);
  const perPage = isNaN(perPageRaw)
    ? DEFAULT_PER_PAGE
    : Math.min(Math.max(perPageRaw, MIN_PER_PAGE), MAX_PER_PAGE);

  // Accept token from Authorization header (preferred) or query param (legacy)
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : searchParams.get('token');

  if (!repo || !token) {
    return NextResponse.json({ error: 'Missing repo or token' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/commits?per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ZIVO-AI',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const commits = await res.json();
  return NextResponse.json({ commits });
}
