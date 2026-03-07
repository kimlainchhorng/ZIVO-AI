'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Copy, Wand2, RefreshCw, ImageIcon } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { toast } from 'sonner';
import type { StylePreset } from '@/types/builder';

const IMAGE_TYPES = [
  { value: 'logo',                   label: 'Logo',          icon: '🎨' },
  { value: 'app_icon',               label: 'App Icon',      icon: '📱' },
  { value: 'hero_banner',            label: 'Hero Banner',   icon: '🖼️' },
  { value: 'social_ad',              label: 'Social Ad',     icon: '📢' },
  { value: 'background_illustration',label: 'Background',    icon: '🌅' },
  { value: 'custom',                 label: 'Custom',        icon: '✨' },
] as const;

const SIZE_PRESETS = [
  { value: '512x512',   label: '512×512',   icon: '⬛' },
  { value: '1024x1024', label: '1024×1024', icon: '⬛' },
  { value: '1024x500',  label: '1024×500',  icon: '🀱' },
  { value: '1792x1024', label: '1792×1024', icon: '🀱' },
  { value: '1080x1920', label: '1080×1920', icon: '📱' },
] as const;

const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: 'premium',              label: '✨ Premium' },
  { value: 'minimal',              label: '⚪ Minimal' },
  { value: 'luxury_dark',          label: '💎 Luxury Dark' },
  { value: 'startup',              label: '⚡ Startup' },
  { value: 'corporate',            label: '🏢 Corporate' },
  { value: 'modern_glassmorphism', label: '🔮 Glassmorphism' },
];

const queryClient = new QueryClient();

interface GalleryImage {
  id: string;
  projectId: string | null;
  ownerId: string;
  url: string;
  prompt: string | null;
  imageType: string | null;
  size: string | null;
  stylePreset: string | null;
  createdAt: string;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zivo_supabase_token');
}

async function fetchGallery(): Promise<GalleryImage[]> {
  const token = getStoredToken();
  if (!token) return [];
  const res = await fetch('/api/image/gallery', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.images ?? [];
}

function AIImageStudioPage() {
  const [imageType, setImageType] = useState<string>('custom');
  const [size, setSize] = useState<string>('1024x1024');
  const [stylePreset, setStylePreset] = useState<StylePreset>('premium');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useInPageDialog, setUseInPageDialog] = useState<{ imageId: string; imageUrl: string } | null>(null);
  const [projectId, setProjectId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [placement, setPlacement] = useState<'background' | 'hero' | 'inline'>('hero');

  const qc = useQueryClient();

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['image-gallery'],
    queryFn: fetchGallery,
    staleTime: 30_000,
  });

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    const token = getStoredToken();
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ prompt, imageType, size, stylePreset }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Image generated!');
        qc.invalidateQueries({ queryKey: ['image-gallery'] });
      } else {
        toast.error(data.error ?? 'Generation failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleUseInPage() {
    if (!useInPageDialog) return;
    const token = getStoredToken();
    if (!token) { toast.error('Not authenticated'); return; }
    if (!projectId || !versionId || !sectionId) { toast.error('Fill all fields'); return; }
    try {
      const res = await fetch('/api/image/use-in-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          imageId: useInPageDialog.imageId,
          projectId, versionId, sectionId, placement,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Image used in page!');
        setUseInPageDialog(null);
      } else {
        toast.error(data.error ?? 'Failed');
      }
    } catch {
      toast.error('Network error');
    }
  }

  const btnActive = (isActive: boolean) => ({
    padding: '0.5rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
    border: `1px solid ${isActive ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.15)'}`,
    background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.05)',
    color: isActive ? '#818cf8' : '#64748b',
    fontSize: '0.8rem', fontWeight: isActive ? 600 : 400,
  });

  const panelStyle = {
    background: 'rgba(15,15,26,0.95)',
    border: '1px solid rgba(99,102,241,0.15)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  };

  return (
    <SidebarLayout>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0a0a0f', color: '#f1f5f9' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: '320px', flexShrink: 0, overflow: 'auto', padding: '1rem', borderRight: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Image Type */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Image Type
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {IMAGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setImageType(t.value)}
                  style={{
                    ...btnActive(imageType === t.value),
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                    padding: '0.625rem 0.5rem',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{t.icon}</span>
                  <span style={{ fontSize: '0.72rem' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Presets */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Size
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SIZE_PRESETS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  style={btnActive(size === s.value)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style Preset */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Style Preset
            </h3>
            <select
              value={stylePreset}
              onChange={(e) => setStylePreset(e.target.value as StylePreset)}
              style={{
                padding: '0.625rem 0.75rem', borderRadius: '8px',
                background: '#0a0a0f', border: '1px solid rgba(99,102,241,0.2)',
                color: '#f1f5f9', fontSize: '0.9rem',
              }}
            >
              {STYLE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Prompt */}
          <div style={panelStyle}>
            <h3 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prompt
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={5}
              style={{
                padding: '0.75rem', borderRadius: '8px',
                background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                color: '#f1f5f9', fontSize: '0.9rem', resize: 'vertical',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#475569' }}>
              {prompt.length} chars
            </div>
            <motion.button
              onClick={handleGenerate}
              disabled={isGenerating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '8px',
                background: isGenerating ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: '0.95rem',
              }}
            >
              {isGenerating ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <RefreshCw size={18} />
                </motion.div>
              ) : <Wand2 size={18} />}
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </motion.button>
          </div>
        </div>

        {/* ── RIGHT PANEL: Gallery ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#f1f5f9', marginBottom: '1.25rem' }}>
            Image Gallery
          </h2>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: '200px', borderRadius: '12px', background: 'rgba(99,102,241,0.05)', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '6rem', border: '2px dashed rgba(99,102,241,0.15)', borderRadius: '16px',
            }}>
              <ImageIcon size={48} style={{ color: '#334155', marginBottom: '1rem' }} />
              <p style={{ color: '#475569' }}>No images yet. Generate your first image!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              <AnimatePresence>
                {images.map((image, idx) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid rgba(99,102,241,0.15)',
                      background: 'rgba(15,15,26,0.8)',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Image */}
                    <div style={{ position: 'relative', paddingBottom: '60%', background: '#000' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.prompt ?? 'Generated image'}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                      />
                    </div>

                    {/* Meta */}
                    <div style={{ padding: '0.875rem' }}>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {image.prompt ?? '—'}
                      </p>
                      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {image.imageType && (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                            {image.imageType}
                          </span>
                        )}
                        {image.size && (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                            {image.size}
                          </span>
                        )}
                        {image.stylePreset && (
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                            {image.stylePreset}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.75rem' }}>
                        {new Date(image.createdAt).toLocaleString()}
                      </p>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setUseInPageDialog({ imageId: image.id, imageUrl: image.url })}
                          style={{
                            flex: 1, padding: '0.375rem', borderRadius: '6px', fontSize: '0.8rem',
                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                            color: '#818cf8', cursor: 'pointer',
                          }}
                        >
                          Use in Page
                        </button>
                        <a
                          href={image.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', padding: '0.375rem',
                            borderRadius: '6px', background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.2)', color: '#10b981',
                          }}
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(image.url);
                            toast.success('URL copied!');
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', padding: '0.375rem',
                            borderRadius: '6px', background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', cursor: 'pointer',
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Use in Page Dialog */}
      <AnimatePresence>
        {useInPageDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={(e) => { if (e.target === e.currentTarget) setUseInPageDialog(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              style={{ background: '#0f0f1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '2rem', width: '420px', maxWidth: '90vw' }}
            >
              <h2 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '1.25rem' }}>Use Image in Page</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'Project ID', value: projectId, setter: setProjectId, placeholder: 'UUID...' },
                  { label: 'Version ID', value: versionId, setter: setVersionId, placeholder: 'UUID...' },
                  { label: 'Section ID', value: sectionId, setter: setSectionId, placeholder: 'section id...' },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>{label}</label>
                    <input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>Placement</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value as typeof placement)}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', background: '#0a0a0f', border: '1px solid rgba(99,102,241,0.2)', color: '#f1f5f9', fontSize: '0.9rem' }}
                  >
                    <option value="hero">Hero</option>
                    <option value="background">Background</option>
                    <option value="inline">Inline</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => setUseInPageDialog(null)} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', color: '#94a3b8', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleUseInPage} style={{ flex: 1, padding: '0.625rem', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Use Image
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
}

export default function AIImageStudioPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AIImageStudioPage />
    </QueryClientProvider>
  );
}
