import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

interface RouteParams { params: Promise<{ id: string; domainId: string }> }

export async function POST(req: Request, { params }: RouteParams) {
  const { id: projectId, domainId } = await params;
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const _user = await getUserFromToken(token);
  if (!_user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = createAuthedClient(token);
  const { data: domainRow, error: fetchError } = await client
    .from('project_domains')
    .select('*')
    .eq('id', domainId)
    .eq('project_id', projectId)
    .single();

  if (fetchError || !domainRow) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

  // Attempt DNS TXT verification via public DNS-over-HTTPS
  let verified = false;
  try {
    const dnsRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_zivo-verify.${domainRow.domain}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (dnsRes.ok) {
      const dnsData = await dnsRes.json() as { Answer?: Array<{ data: string }> };
      const answers = dnsData.Answer ?? [];
      verified = answers.some((a) => a.data.includes(domainRow.verification_token as string));
    }
  } catch { /* DNS lookup failed — keep verified=false */ }

  const newStatus = verified ? 'pending_tls' : 'error';
  const errorMessage = verified ? null : 'DNS TXT record not found. Add _zivo-verify TXT record with the verification token.';

  const { data: updated, error: updateError } = await client
    .from('project_domains')
    .update({ status: newStatus, error_message: errorMessage })
    .eq('id', domainId)
    .eq('project_id', projectId)
    .select('*')
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ domain: updated, verified });
}
