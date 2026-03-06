import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ImageGenerationRequestSchema } from '@/types/builder';
import { injectStylePreset } from '@/lib/theme';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

// DALL-E 3 only supports 1024x1024, 1792x1024, 1024x1792
function mapToDallE3Size(size: string): '1024x1024' | '1792x1024' | '1024x1792' {
  if (size === '1792x1024') return '1792x1024';
  if (size === '1080x1920') return '1024x1792';
  return '1024x1024';
}

export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get('Authorization'));

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ImageGenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const { prompt, imageType, size, stylePreset, projectId } = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  const styleContext = stylePreset ? injectStylePreset(stylePreset) : '';
  const fullPrompt = `${imageType.replace(/_/g, ' ')} for a brand: ${prompt}. ${styleContext}`.trim();
  const dallESize = mapToDallE3Size(size);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      size: dallESize,
      quality: 'hd',
      n: 1,
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL returned from DALL-E' }, { status: 500 });
    }

    // Save to image_gallery if authenticated
    let galleryId: string | undefined;
    if (token) {
      try {
        const user = await getUserFromToken(token);
        if (user) {
          const client = createAuthedClient(token);
          const { data: galleryRow } = await client
            .from('image_gallery')
            .insert({
              owner_id: user.id,
              project_id: projectId ?? null,
              url: imageUrl,
              prompt,
              image_type: imageType,
              size,
              style_preset: stylePreset ?? null,
            })
            .select('id')
            .single();
          galleryId = galleryRow?.id;
        }
      } catch {
        // Non-fatal: gallery save failed
      }
    }

    return NextResponse.json({ success: true, url: imageUrl, galleryId });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Image generation failed' }, { status: 500 });
  }
}
