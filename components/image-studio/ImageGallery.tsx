'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  size: string;
  image_type: string;
  created_at: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onSelect: (image: GalleryImage) => void;
  onInsert?: (image: GalleryImage) => void;
}

const COLORS = {
  bgCard: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textMuted: '#475569',
  overlay: 'rgba(10,11,20,0.85)',
};

export default function ImageGallery({ images, onSelect, onInsert }: ImageGalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1rem',
          color: COLORS.textMuted,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🖼️</div>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>No images yet. Generate your first image above.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        columns: '2 auto',
        columnGap: '0.75rem',
        padding: '0.5rem',
      }}
    >
      <AnimatePresence>
        {images.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'relative',
              breakInside: 'avoid',
              marginBottom: '0.75rem',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: `1px solid ${COLORS.border}`,
            }}
            onMouseEnter={() => setHoveredId(image.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect(image)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.prompt}
              style={{ width: '100%', display: 'block', borderRadius: '10px' }}
            />

            <AnimatePresence>
              {hoveredId === image.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: COLORS.overlay,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '0.875rem',
                    borderRadius: '10px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.6875rem',
                      color: COLORS.textMuted,
                      margin: '0 0 0.25rem 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {image.size} · {image.image_type.replace(/_/g, ' ')}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: COLORS.textPrimary,
                      margin: '0 0 0.625rem 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {image.prompt}
                  </p>
                  {onInsert && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInsert(image);
                      }}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Use in page →
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
