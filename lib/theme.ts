export const stylePresets = {
  premium: {
    primaryColor: '#6366f1',
    backgroundColor: '#0f0f1a',
    textColor: '#f1f5f9',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '12px',
    shadowStyle: '0 25px 50px rgba(99,102,241,0.25)',
    description: 'Premium dark theme with indigo accents and sophisticated gradients',
    classes: 'bg-slate-950 text-slate-50 font-sans',
  },
  minimal: {
    primaryColor: '#18181b',
    backgroundColor: '#ffffff',
    textColor: '#18181b',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '6px',
    shadowStyle: '0 1px 3px rgba(0,0,0,0.1)',
    description: 'Clean minimal design with maximum whitespace and typography focus',
    classes: 'bg-white text-zinc-900 font-sans',
  },
  luxury_dark: {
    primaryColor: '#d4af37',
    backgroundColor: '#0a0a0a',
    textColor: '#f5f0e8',
    fontFamily: 'Playfair Display, serif',
    borderRadius: '4px',
    shadowStyle: '0 20px 60px rgba(212,175,55,0.15)',
    description: 'Opulent dark luxury with gold accents and serif typography',
    classes: 'bg-black text-amber-50 font-serif',
  },
  startup: {
    primaryColor: '#10b981',
    backgroundColor: '#f8fafc',
    textColor: '#0f172a',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    borderRadius: '16px',
    shadowStyle: '0 10px 30px rgba(16,185,129,0.2)',
    description: 'Energetic startup vibe with green accent and rounded corners',
    classes: 'bg-slate-50 text-slate-900 font-sans',
  },
  corporate: {
    primaryColor: '#1e40af',
    backgroundColor: '#f9fafb',
    textColor: '#111827',
    fontFamily: 'IBM Plex Sans, sans-serif',
    borderRadius: '8px',
    shadowStyle: '0 4px 12px rgba(30,64,175,0.12)',
    description: 'Professional corporate look with blue brand color and structured layout',
    classes: 'bg-gray-50 text-gray-900 font-sans',
  },
  modern_glassmorphism: {
    primaryColor: '#a855f7',
    backgroundColor: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    textColor: '#ffffff',
    fontFamily: 'Poppins, sans-serif',
    borderRadius: '20px',
    shadowStyle: '0 8px 32px rgba(168,85,247,0.3)',
    description: 'Modern glassmorphism with purple gradient background and frosted glass cards',
    classes: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans',
  },
} as const;

export type StylePreset = keyof typeof stylePresets;

export function injectStylePreset(preset: StylePreset): string {
  const p = stylePresets[preset];
  return `Apply the following design style: ${p.description}. 
Use these design tokens: primary color ${p.primaryColor}, background ${p.backgroundColor}, text color ${p.textColor}, font family ${p.fontFamily}, border radius ${p.borderRadius}, shadows ${p.shadowStyle}. 
Apply Tailwind CSS classes: ${p.classes}. 
Ensure all components follow this aesthetic consistently.`;
}
