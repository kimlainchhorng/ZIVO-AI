/**
 * lib/schemas/ui-schema.ts
 * Single source of truth: re-exports canonical schemas from types/builder.ts.
 * Do NOT duplicate schema definitions here — import from types/builder.ts instead.
 */
export {
  SectionSchema,
  SectionTypeEnum,
  PageSchema,
  NavigationSchema,
  FooterSchema,
  UIOutputSchema,
  StylePresetEnum,
} from '@/types/builder';

export type {
  Section,
  SectionType,
  Page,
  Navigation,
  Footer,
  UIOutput,
  StylePreset,
} from '@/types/builder';
