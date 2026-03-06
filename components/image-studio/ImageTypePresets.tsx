'use client';

import { motion } from 'framer-motion';

const IMAGE_TYPES = [
  { value: 'logo', label: 'Logo', icon: '🎨', desc: 'Brand identity mark' },
  { value: 'app_icon', label: 'App Icon', icon: '📱', desc: 'iOS/Android icon' },
  { value: 'hero_banner', label: 'Hero Banner', icon: '🖼️', desc: 'Landing page hero' },
  { value: 'social_ad', label: 'Social Ad', icon: '📣', desc: 'Social media ad' },
  { value: 'background_illustration', label: 'Background', icon: '🌌', desc: 'Full-page background' },
  { value: 'product_photo', label: 'Product Photo', icon: '📦', desc: 'Product showcase' },
  { value: 'avatar', label: 'Avatar', icon: '👤', desc: 'Profile picture' },
  { value: 'pattern_texture', label: 'Pattern / Texture', icon: '🔲', desc: 'Repeating pattern' },
];

const COLORS = {
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textMuted: '#475569',
};

interface ImageTypePresetsProps {
  value: string;
  onChange: (type: string) => void;
}

export default function ImageTypePresets({ value, onChange }: ImageTypePresetsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
      {IMAGE_TYPES.map((type) => {
        const isSelected = value === type.value;
        return (
          <motion.button
            key={type.value}
            onClick={() => onChange(type.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.875rem 0.5rem',
              background: isSelected ? 'rgba(99,102,241,0.12)' : COLORS.bgCard,
              border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              outline: 'none',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{type.icon}</span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: isSelected ? COLORS.accent : COLORS.textPrimary,
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              {type.label}
            </span>
            <span
              style={{
                fontSize: '0.625rem',
                color: COLORS.textMuted,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {type.desc}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
