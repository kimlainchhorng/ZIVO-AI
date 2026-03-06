import { NextResponse } from 'next/server';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';
import { z } from 'zod';

export const runtime = 'nodejs';

export interface ImageGalleryItem {
  id: string;
  projectId: string | null;
  ownerId: string;
  url: string;
  prompt: string | null;
  imageType: string | null;
  size: string | null;
  stylePreset: string | null;
  createdAt: string;
}

export async function GET(req: Request) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');

  const client = createAuthedClient(token);

  let query = client
    .from('image_gallery')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (projectId) {
    const uuidParsed = z.string().uuid().safeParse(projectId);
    if (!uuidParsed.success) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const images: ImageGalleryItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    projectId: row.project_id as string | null,
    ownerId: row.owner_id as string,
    url: row.url as string,
    prompt: row.prompt as string | null,
    imageType: row.image_type as string | null,
    size: row.size as string | null,
    stylePreset: row.style_preset as string | null,
    createdAt: row.created_at as string,
  }));

  return NextResponse.json({ images });
}
