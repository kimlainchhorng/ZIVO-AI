import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { SectionSchema, StylePresetEnum, UIOutputSchema } from '@/types/builder';
import { injectStylePreset } from '@/lib/theme';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  projectId: z.string().uuid(),
  versionId: z.string().uuid(),
  sectionId: z.string(),
  sectionType: z.string(),
  prompt: z.string().min(3),
  stylePreset: StylePresetEnum.optional(),
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

  const { projectId, versionId, sectionId, sectionType, prompt, stylePreset } = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const client = createAuthedClient(token);

  // Load existing version
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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const styleDirective = stylePreset ? injectStylePreset(stylePreset) : '';

  const SECTION_SCHEMA = JSON.stringify({
    type: 'object',
    properties: {
      id: { type: 'string' },
      type: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      order: { type: 'number' },
      bgColor: { type: 'string' },
      textColor: { type: 'string' },
    },
    required: ['id', 'type', 'title', 'content', 'order'],
  });

  const systemPrompt = `You are ZIVO-AI, an expert UI/UX designer.
Regenerate a single website section in JSON format.
${styleDirective}
Return ONLY valid JSON matching this schema: ${SECTION_SCHEMA}
Section type: ${sectionType}
Keep the same section id: ${sectionId}
Provide realistic, detailed placeholder content.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    });

    const rawContent = completion.choices[0]?.message?.content ?? '{}';
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
    }

    const sectionResult = SectionSchema.safeParse(jsonData);
    if (!sectionResult.success) {
      return NextResponse.json({ error: 'AI response did not match section schema', details: sectionResult.error.flatten() }, { status: 500 });
    }

    const newSection = sectionResult.data;

    // Update snapshot: replace section in all pages
    const updatedSnapshot = snapshot.data;
    for (const page of updatedSnapshot.pages) {
      const idx = page.sections.findIndex((s) => s.id === sectionId);
      if (idx !== -1) {
        page.sections[idx] = newSection;
      }
    }

    // Create new version with incremented version_number
    const { data: latestVersion } = await client
      .from('project_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (latestVersion?.version_number ?? version.version_number) + 1;
    const allSections = updatedSnapshot.pages.flatMap((p) => p.sections);

    const { data: newVersion, error: insertError } = await client
      .from('project_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersionNumber,
        label: `Section regenerated: ${sectionType}`,
        snapshot: updatedSnapshot,
        style_preset: stylePreset ?? version.style_preset,
        pages: updatedSnapshot.pages,
        sections: allSections,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save new version' }, { status: 500 });
    }

    return NextResponse.json({ success: true, section: newSection, newVersionId: newVersion?.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Regeneration failed' }, { status: 500 });
  }
}
