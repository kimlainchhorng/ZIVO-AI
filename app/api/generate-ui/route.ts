import { NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { UIOutputSchema, StylePresetEnum } from '@/types/builder';
import { injectStylePreset } from '@/lib/theme';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  prompt: z.string().min(3),
  stylePreset: StylePresetEnum.optional().default('premium'),
  pages: z.array(z.string()).optional(),
  projectId: z.string().uuid().optional(),
});

const UI_OUTPUT_JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    stylePreset: { type: 'string', enum: ['premium', 'minimal', 'luxury_dark', 'startup', 'corporate', 'modern_glassmorphism'] },
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          isHome: { type: 'boolean' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['hero', 'features', 'pricing', 'testimonials', 'faq', 'contact', 'dashboard_cards', 'login_signup', 'footer', 'navigation', 'custom'] },
                title: { type: 'string' },
                content: { type: 'string' },
                order: { type: 'number' },
                bgColor: { type: 'string' },
                textColor: { type: 'string' },
              },
              required: ['id', 'type', 'title', 'content', 'order'],
            },
          },
        },
        required: ['id', 'name', 'slug', 'sections'],
      },
    },
    navigation: {
      type: 'object',
      properties: {
        links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, href: { type: 'string' } }, required: ['label', 'href'] } },
        logo: { type: 'string' },
      },
    },
    footer: {
      type: 'object',
      properties: {
        links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, href: { type: 'string' } }, required: ['label', 'href'] } },
        copyright: { type: 'string' },
      },
    },
  },
  required: ['title', 'pages'],
});

export async function POST(req: Request) {
  const token = extractBearerToken(req.headers.get('Authorization'));

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

  const { prompt, stylePreset, projectId } = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  const styleDirective = injectStylePreset(stylePreset ?? 'premium');

  const systemPrompt = `You are ZIVO-AI, an expert UI/UX designer and React developer.
Generate a complete multi-page website UI in JSON format.
${styleDirective}
Return ONLY valid JSON matching this schema: ${UI_OUTPUT_JSON_SCHEMA}
Include pages: Home, About, Pricing, Contact, Dashboard, Settings.
Include navigation links and footer.
For each section, provide realistic placeholder content.
Use unique UUIDs or short IDs for id fields.
Do not include any markdown, code blocks, or extra text — only the raw JSON object.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    });

    const rawContent = completion.choices[0]?.message?.content ?? '{}';
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(rawContent);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 });
    }

    const uiOutput = UIOutputSchema.safeParse(jsonData);
    if (!uiOutput.success) {
      return NextResponse.json({ error: 'AI response did not match expected schema', details: uiOutput.error.flatten() }, { status: 500 });
    }

    // Save version if projectId provided
    let versionId: string | undefined;
    if (projectId && token) {
      try {
        const user = await getUserFromToken(token);
        if (user) {
          const client = createAuthedClient(token);
          // Get current max version number
          const { data: versions } = await client
            .from('project_versions')
            .select('version_number')
            .eq('project_id', projectId)
            .order('version_number', { ascending: false })
            .limit(1);
          const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;
          const allSections = uiOutput.data.pages.flatMap((p) => p.sections);
          const { data: versionRow } = await client
            .from('project_versions')
            .insert({
              project_id: projectId,
              version_number: nextVersion,
              snapshot: uiOutput.data,
              style_preset: uiOutput.data.stylePreset ?? stylePreset,
              pages: uiOutput.data.pages,
              sections: allSections,
              created_by: user.id,
            })
            .select('id')
            .single();
          versionId = versionRow?.id;
        }
      } catch {
        // Non-fatal: version save failed
      }
    }

    return NextResponse.json({ success: true, data: uiOutput.data, versionId });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message ?? 'Generation failed' }, { status: 500 });
  }
}
