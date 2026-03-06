import { NextResponse } from 'next/server';
import { z } from 'zod';
import { UIOutputSchema, SectionSchema } from '@/types/builder';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  imageId: z.string().uuid(),
  projectId: z.string().uuid(),
  versionId: z.string().uuid(),
  sectionId: z.string(),
  placement: z.enum(['background', 'hero', 'inline']),
});

export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { imageId, projectId, versionId, sectionId, placement } = parsed.data;

  const client = createAuthedClient(token);

  // Fetch image
  const { data: image, error: imageError } = await client
    .from('image_gallery')
    .select('url')
    .eq('id', imageId)
    .eq('owner_id', user.id)
    .single();

  if (imageError || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  // Fetch version
  const { data: version, error: versionError } = await client
    .from('project_versions')
    .select('*')
    .eq('id', versionId)
    .eq('project_id', projectId)
    .single();

  if (versionError || !version) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  const snapshot = UIOutputSchema.safeParse(version.snapshot);
  if (!snapshot.success) {
    return NextResponse.json({ error: 'Invalid snapshot data' }, { status: 500 });
  }

  const imageUrl = image.url as string;

  // Update section with image
  let updatedSection = null;
  const updatedSnapshot = snapshot.data;
  for (const page of updatedSnapshot.pages) {
    const section = page.sections.find((s) => s.id === sectionId);
    if (section) {
      if (placement === 'background') {
        section.bgColor = `url(${imageUrl})`;
      } else if (placement === 'hero') {
        section.content = `${section.content}\n\n![Hero Image](${imageUrl})`;
      } else {
        section.content = `${section.content}\n\n![Image](${imageUrl})`;
      }
      updatedSection = section;
      break;
    }
  }

  if (!updatedSection) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  // Update version
  await client
    .from('project_versions')
    .update({ snapshot: updatedSnapshot, pages: updatedSnapshot.pages })
    .eq('id', versionId);

  const sectionResult = SectionSchema.safeParse(updatedSection);
  return NextResponse.json({
    success: true,
    updatedSection: sectionResult.success ? sectionResult.data : updatedSection,
  });
}
