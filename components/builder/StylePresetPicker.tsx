'use client';

import { motion } from 'framer-motion';
import type { StylePreset } from '@/types/builder';
import { stylePresets } from '@/lib/style-presets';

interface StylePresetPickerProps {
  value: StylePreset;
  onChange: (preset: StylePreset) => void;
}

const COLORS = {
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textMuted: '#475569',
};

export default function StylePresetPicker({ value, onChange }: StylePresetPickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
      {(Object.entries(stylePresets) as [StylePreset, (typeof stylePresets)[StylePreset]][]).map(
        ([key, preset]) => {
          const isSelected = value === key;
          const colorSwatches = [
            preset.colors.primary,
            preset.colors.secondary,
            preset.colors.accent,
            preset.colors.background,
          ];

          return (
            <motion.button
              key={key}
              onClick={() => onChange(key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.375rem',
                padding: '0.75rem',
                background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                boxShadow: isSelected ? `0 0 0 1px ${COLORS.accent}` : 'none',
                transition: 'all 0.15s',
              }}
            >
              {/* Color swatches */}
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {colorSwatches.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      background: color.startsWith('linear') ? color : color,
                      border: '1px solid rgba(255,255,255,0.1)',
                      flexShrink: 0,
                    }}
                  />
                ))}
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.75rem',
                      color: COLORS.accent,
                    }}
                  >
                    ✓
                  </motion.span>
                )}
              </div>

              {/* Name */}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isSelected ? COLORS.accent : COLORS.textPrimary,
                  lineHeight: 1,
                }}
              >
                {preset.name}
              </span>

              {/* Font hint */}
              <span
                style={{
                  fontSize: '0.625rem',
                  color: COLORS.textMuted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {preset.fonts.sans.split(',')[0].trim()}
              </span>
            </motion.button>
          );
        }
      )}
    </div>
  );
}
