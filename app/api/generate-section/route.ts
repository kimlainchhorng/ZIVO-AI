import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { SectionSchema, StylePresetEnum } from '@/types/builder';
import { injectStylePreset } from '@/lib/theme';
import { extractBearerToken, getUserFromToken, createAuthedClient } from '@/lib/db/projects-db';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  sectionType: z.enum([
    'hero', 'features', 'pricing', 'testimonials', 'faq', 'contact',
    'dashboard_cards', 'login_signup', 'footer', 'navigation', 'custom',
  ]),
  stylePreset: StylePresetEnum.optional().default('premium'),
  prompt: z.string().optional(),
  projectId: z.string().uuid().optional(),
  pageId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const { sectionType, stylePreset, prompt, projectId, pageId } = parsed.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const styleInstruction = injectStylePreset(stylePreset ?? 'premium');
    const userPrompt = prompt
      ? `Generate a "${sectionType}" section: ${prompt}`
      : `Generate a high-quality "${sectionType}" section with compelling copy and modern design.`;

    const systemPrompt = `You are an expert UI designer and developer. Generate a single UI section as JSON.
${styleInstruction}
Return ONLY valid JSON matching the provided schema. The "content" field must be complete, self-contained HTML with inline Tailwind CSS classes.
Generate realistic, production-quality copy. Use semantic HTML.`;

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const rawJson = completion.choices[0]?.message?.content;
    if (!rawJson) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let sectionData: unknown;
    try {
      sectionData = JSON.parse(rawJson);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Ensure required fields
    const withDefaults = {
      id: randomUUID(),
      order: 0,
      ...(sectionData as Record<string, unknown>),
      type: sectionType,
    };

    const validated = SectionSchema.safeParse(withDefaults);
    if (!validated.success) {
      return NextResponse.json({ error: 'Section schema validation failed', details: validated.error.flatten() }, { status: 422 });
    }

    const section = validated.data;

    // Optionally persist to Supabase
    if (projectId) {
      const token = extractBearerToken(req.headers.get('authorization'));
      if (token) {
        const user = await getUserFromToken(token);
        if (user) {
          const supabase = createAuthedClient(token);
          await supabase.from('project_sections').insert({
            id: section.id,
            project_id: projectId,
            page_id: pageId ?? null,
            type: section.type,
            title: section.title,
            content: section.content,
            order: section.order,
            style_preset: stylePreset,
            metadata: {
              bgColor: section.bgColor,
              textColor: section.textColor,
              spacing: section.spacing,
              fontSize: section.fontSize,
              borderRadius: section.borderRadius,
            },
          });
        }
      }
    }

    return NextResponse.json({ section }, { status: 200 });
  } catch (err) {
    console.error('[generate-section]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
