'use client';

/**
 * app/image-studio/page.tsx
 * Full AI Image Studio page.
 * Uses: framer-motion, Tailwind, lucide-react, Supabase gallery
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Download, Copy, Wand2, RefreshCw, ImageIcon, X, CheckCircle2, Filter } from 'lucide-react';
import SidebarLayout from '@/components/layout/SidebarLayout';
import { toast } from 'sonner';
import type { StylePreset } from '@/types/builder';

// ─── Constants ────────────────────────────────────────────────────────────────

const IMAGE_TYPES = [
  { value: 'logo', label: 'Logo', icon: '🎨' },
  { value: 'app_icon', label: 'App Icon', icon: '📱' },
  { value: 'hero_banner', label: 'Hero Banner', icon: '🖼️' },
  { value: 'social_ad', label: 'Social Ad', icon: '📢' },
  { value: 'background_illustration', label: 'Background', icon: '🌅' },
  { value: 'custom', label: 'Custom', icon: '✨' },
] as const;

const SIZE_PRESETS = [
  { value: '512x512', label: '512×512', aspect: 'Square' },
  { value: '1024x1024', label: '1024×1024', aspect: 'Square' },
  { value: '1024x500', label: '1024×500', aspect: 'Banner' },
  { value: '1792x1024', label: '1792×1024', aspect: 'Wide' },
  { value: '1080x1920', label: '1080×1920', aspect: 'Portrait' },
] as const;

const STYLE_PRESETS: { value: StylePreset; label: string; color: string }[] = [
  { value: 'premium', label: '✨ Premium', color: '#6366f1' },
  { value: 'minimal', label: '⚪ Minimal', color: '#18181b' },
  { value: 'luxury_dark', label: '💎 Luxury Dark', color: '#d4af37' },
  { value: 'startup', label: '⚡ Startup', color: '#10b981' },
  { value: 'corporate', label: '🏢 Corporate', color: '#1e40af' },
  { value: 'modern_glassmorphism', label: '🔮 Glassmorphism', color: '#a855f7' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryImage {
  id: string;
  project_id: string | null;
  owner_user_id: string;
  url: string;
  prompt: string | null;
  type: string | null;
  size: string | null;
  created_at: string;
}

interface GeneratedImage {
  url: string;
  id?: string;
  type?: string;
  size?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Use-in-page modal ────────────────────────────────────────────────────────

interface UseInPageModalProps {
  imageUrl: string;
  onClose: () => void;
}

function UseInPageModal({ imageUrl, onClose }: UseInPageModalProps) {
  const [projectId, setProjectId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [placement, setPlacement] = useState<'background' | 'hero' | 'inline'>('hero');
  const [isInserting, setIsInserting] = useState(false);

  async function handleInsert() {
    const token = getStoredToken();
    if (!token) { toast.error('Not authenticated'); return; }
    if (!projectId || !versionId || !sectionId) {
      toast.error('Fill in all fields');
      return;
    }
    setIsInserting(true);
    try {
      const res = await fetch('/api/image/use-in-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, versionId, sectionId, imageUrl, placement }),
      });
      if (res.ok) {
        toast.success('Image inserted into page!');
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error ?? 'Insert failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsInserting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-indigo-500/20 bg-slate-950 p-6 flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Use Image in Page</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Preview" className="w-full rounded-xl object-cover max-h-40" />

        <div className="flex flex-col gap-3">
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Project ID (UUID)"
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          <input
            value={versionId}
            onChange={(e) => setVersionId(e.target.value)}
            placeholder="Version ID (UUID)"
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          <input
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            placeholder="Section ID"
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as 'background' | 'hero' | 'inline')}
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm focus:outline-none"
          >
            <option value="hero">Hero Image</option>
            <option value="background">Background</option>
            <option value="inline">Inline</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInsert}
            disabled={isInserting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isInserting ? 'Inserting…' : 'Insert into Page'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Gallery Item ─────────────────────────────────────────────────────────────

interface GalleryItemProps {
  image: GalleryImage;
  onSelect: (image: GalleryImage) => void;
  onInsert: (image: GalleryImage) => void;
  isSelected: boolean;
}

function GalleryItem({ image, onSelect, onInsert, isSelected }: GalleryItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group rounded-xl overflow-hidden border transition-all cursor-pointer ${
        isSelected ? 'border-indigo-500/60 ring-2 ring-indigo-500/30' : 'border-white/10 hover:border-indigo-500/30'
      }`}
      onClick={() => onSelect(image)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.prompt ?? 'Generated image'}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
        <p className="text-xs text-slate-300 text-center line-clamp-2">{image.prompt}</p>
        <div className="flex gap-1.5">
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs">{image.type ?? 'custom'}</span>
          <span className="px-2 py-0.5 rounded bg-white/10 text-slate-400 text-xs">{image.size ?? '1024x1024'}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onInsert(image); }}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
        >
          Insert into Page
        </button>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 size={16} className="text-indigo-400" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Inner studio (needs QueryClientProvider) ─────────────────────────────────

function ImageStudioInner() {
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [imageType, setImageType] = useState<string>('custom');
  const [size, setSize] = useState<string>('1024x1024');
  const [stylePreset, setStylePreset] = useState<StylePreset>('premium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);
  const [useInPageImage, setUseInPageImage] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { data: galleryImages = [], isLoading: galleryLoading } = useQuery<GalleryImage[]>({
    queryKey: ['image-gallery'],
    queryFn: fetchGallery,
    staleTime: 30_000,
  });

  const filteredImages =
    typeFilter === 'all' ? galleryImages : galleryImages.filter((img) => img.type === typeFilter);

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return; }
    const token = getStoredToken();
    if (!token) { toast.error('Please sign in to generate images'); return; }
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt, imageType, size, stylePreset }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Generation failed');
        return;
      }
      setGeneratedImage({ url: data.url, id: data.id, type: data.type, size: data.size });
      toast.success('Image generated!');
      qc.invalidateQueries({ queryKey: ['image-gallery'] });
    } catch {
      toast.error('Network error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload(url: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `zivo-image-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Image downloaded!');
    } catch {
      toast.error('Download failed');
    }
  }

  async function handleCopyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success('URL copied!');
  }

  const displayImage = selectedGalleryImage
    ? { url: selectedGalleryImage.url }
    : generatedImage;

  return (
    <SidebarLayout>
      <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto border-r border-indigo-500/10 p-4 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-100">🎨 Image Studio</h1>
            <p className="text-xs text-slate-500 mt-0.5">AI-powered image generation</p>
          </div>

          {/* Prompt */}
          <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Prompt</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200 text-sm placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500/40"
            />
          </div>

          {/* Image Type */}
          <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Image Type</p>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setImageType(t.value)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    imageType === t.value
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-white/3 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Presets */}
          <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Size</p>
            <div className="flex flex-col gap-1.5">
              {SIZE_PRESETS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    size === s.value
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 bg-white/3 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="text-slate-600">{s.aspect}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Preset */}
          <div className="rounded-xl border border-indigo-500/15 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-3">Style</p>
            <div className="flex flex-col gap-1.5">
              {STYLE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setStylePreset(p.value)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    stylePreset === p.value
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            onClick={handleGenerate}
            disabled={isGenerating}
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
              isGenerating
                ? 'bg-indigo-500/30 text-indigo-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20'
            }`}
          >
            {isGenerating ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={18} />
              </motion.div>
            ) : <Wand2 size={18} />}
            {isGenerating ? 'Generating…' : 'Generate Image'}
          </motion.button>
        </aside>

        {/* ── CENTER / PREVIEW ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="w-80 h-80 rounded-2xl border-2 border-dashed border-indigo-500/20 flex items-center justify-center bg-indigo-500/5">
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    >
                      <ImageIcon size={40} className="text-indigo-500/50" />
                    </motion.div>
                    <p className="text-slate-500 text-sm">Generating your image…</p>
                    <motion.div className="w-48 h-1 rounded-full bg-indigo-500/20 overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : displayImage ? (
              <motion.div
                key="image"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage.url}
                    alt="Generated image"
                    className="max-w-xl max-h-[500px] object-contain"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDownload(displayImage.url)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
                  >
                    <Download size={15} />
                    Download
                  </button>
                  <button
                    onClick={() => handleCopyUrl(displayImage.url)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
                  >
                    <Copy size={15} />
                    Copy URL
                  </button>
                  <button
                    onClick={() => setUseInPageImage(displayImage.url)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                  >
                    Use in Page
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 mt-8"
              >
                <div className="w-72 h-72 rounded-2xl border-2 border-dashed border-indigo-500/10 flex items-center justify-center bg-indigo-500/3">
                  <div className="flex flex-col items-center gap-3">
                    <ImageIcon size={48} className="text-slate-700" />
                    <p className="text-slate-600 text-sm text-center max-w-48">
                      Enter a prompt and click Generate to create an AI image
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── RIGHT PANEL / GALLERY ────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 overflow-y-auto border-l border-indigo-500/10 p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Gallery History</h2>
            <span className="text-xs text-slate-600">{galleryImages.length} images</span>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={12} className="text-slate-500 flex-shrink-0" />
            {['all', ...IMAGE_TYPES.map((t) => t.value)].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  typeFilter === type
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {type === 'all' ? 'All' : IMAGE_TYPES.find((t) => t.value === type)?.label ?? type}
              </button>
            ))}
          </div>

          {/* Gallery grid */}
          {galleryLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-600 text-sm">
              Loading gallery…
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-600">
              <ImageIcon size={28} />
              <p className="text-xs text-center">No images yet. Generate some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence>
                {filteredImages.map((img) => (
                  <GalleryItem
                    key={img.id}
                    image={img}
                    isSelected={selectedGalleryImage?.id === img.id}
                    onSelect={(i) => {
                      setSelectedGalleryImage((prev) => prev?.id === i.id ? null : i);
                    }}
                    onInsert={(i) => setUseInPageImage(i.url)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </aside>
      </div>

      {/* ── Use in page modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {useInPageImage && (
          <UseInPageModal
            imageUrl={useInPageImage}
            onClose={() => setUseInPageImage(null)}
          />
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
}

// ─── QueryClient wrapper ──────────────────────────────────────────────────────

const queryClient = new QueryClient();

export default function ImageStudioPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ImageStudioInner />
    </QueryClientProvider>
  );
}
