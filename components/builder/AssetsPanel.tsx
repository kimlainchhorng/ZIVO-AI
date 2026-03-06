// components/builder/AssetsPanel.tsx — Assets management panel for the builder workspace
// Shows current icons/illustrations/og image; allows upload/replace and reset to placeholders.

'use client';

import { useState, useRef } from 'react';
import { Upload, RefreshCw, Image, LayoutGrid, FileImage, AlertCircle, CheckCircle2, ImageIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssetEntry {
  name: string;
  path: string;
  /** Resolved URL for preview (could be /path or a data URL after upload) */
  previewUrl: string;
  type: 'icon' | 'illustration' | 'og' | 'favicon';
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface AssetsPanelProps {
  token: string;
  projectId: string;
}

// ─── Default placeholder asset registry ───────────────────────────────────────

const DEFAULT_ICONS: AssetEntry[] = [
  { name: 'Analytics', path: 'public/icons/analytics.svg', previewUrl: '/icons/analytics.svg', type: 'icon' },
  { name: 'Team', path: 'public/icons/team.svg', previewUrl: '/icons/team.svg', type: 'icon' },
  { name: 'Security', path: 'public/icons/security.svg', previewUrl: '/icons/security.svg', type: 'icon' },
  { name: 'API', path: 'public/icons/api.svg', previewUrl: '/icons/api.svg', type: 'icon' },
  { name: 'Performance', path: 'public/icons/performance.svg', previewUrl: '/icons/performance.svg', type: 'icon' },
  { name: 'Integration', path: 'public/icons/integration.svg', previewUrl: '/icons/integration.svg', type: 'icon' },
];

const DEFAULT_ILLUSTRATIONS: AssetEntry[] = [
  { name: 'Hero', path: 'public/illustrations/hero.svg', previewUrl: '/illustrations/hero.svg', type: 'illustration' },
  { name: 'Features', path: 'public/illustrations/features.svg', previewUrl: '/illustrations/features.svg', type: 'illustration' },
  { name: 'Pricing', path: 'public/illustrations/pricing.svg', previewUrl: '/illustrations/pricing.svg', type: 'illustration' },
];

const DEFAULT_OG: AssetEntry = {
  name: 'OG / Social Image',
  path: 'public/og.svg',
  previewUrl: '/og.svg',
  type: 'og',
};

const DEFAULT_FAVICON: AssetEntry = {
  name: 'Favicon',
  path: 'public/favicon.svg',
  previewUrl: '/favicon.svg',
  type: 'favicon',
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface AssetCardProps {
  asset: AssetEntry;
  overrideUrl: string | undefined;
  onUpload: (path: string, file: File) => void;
  onReset: (path: string) => void;
  uploading: boolean;
}

function AssetCard({ asset, overrideUrl, onUpload, onReset, uploading }: AssetCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = overrideUrl ?? asset.previewUrl;
  const isReplaced = Boolean(overrideUrl);

  const [imgError, setImgError] = useState(false);
  // Reset error state when source changes (e.g., after a successful upload)
  const prevSrcRef = useRef(previewSrc);
  if (prevSrcRef.current !== previewSrc) {
    prevSrcRef.current = previewSrc;
    setImgError(false);
  }

  return (
    <div style={cardStyle}>
      {/* Preview */}
      <div style={previewBoxStyle}>
        {imgError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
            <ImageIcon size={20} />
            <span style={{ fontSize: '0.65rem' }}>Preview unavailable</span>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewSrc}
            alt={asset.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Info + actions */}
      <div style={{ padding: '0.5rem 0.75rem 0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{asset.name}</span>
          {isReplaced && (
            <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: '99px', border: '1px solid rgba(16,185,129,0.3)' }}>
              replaced
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
          {asset.path}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={actionBtnStyle}
            title="Upload replacement asset"
          >
            <Upload size={11} />
            Replace
          </button>
          {isReplaced && (
            <button
              onClick={() => onReset(asset.path)}
              style={{ ...actionBtnStyle, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171' }}
              title="Reset to placeholder"
            >
              <RefreshCw size={11} />
              Reset
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.svg"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(asset.path, file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function AssetsPanel({ token, projectId }: AssetsPanelProps) {
  // Map of asset path → override preview URL (data URL or uploaded URL)
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadMsg, setUploadMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleUpload(assetPath: string, file: File): Promise<void> {
    setUploading((prev) => ({ ...prev, [assetPath]: true }));
    setUploadMsg(null);

    try {
      // Show local data URL immediately for instant preview
      const dataUrl = await readFileAsDataUrl(file);
      setOverrides((prev) => ({ ...prev, [assetPath]: dataUrl }));

      // Also upload to the server asset manager
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('assetPath', assetPath);

      const res = await fetch('/api/asset-manager/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const raw = await res.json() as Record<string, unknown>;
      const result: UploadResult = {
        success: raw.success === true,
        url: typeof raw.url === 'string' ? raw.url : undefined,
        error: typeof raw.error === 'string' ? raw.error : undefined,
      };
      if (result.success && result.url) {
        // Replace data URL with the stable server URL
        setOverrides((prev) => ({ ...prev, [assetPath]: result.url! }));
        setUploadMsg({ text: `Uploaded ${file.name} successfully.`, ok: true });
      } else {
        // Keep local data URL preview even if server upload failed
        setUploadMsg({ text: result.error ?? 'Upload failed — preview only (not persisted).', ok: false });
      }
    } catch (_err) {
      setUploadMsg({ text: 'Upload error — preview only (not persisted).', ok: false });
    } finally {
      setUploading((prev) => ({ ...prev, [assetPath]: false }));
    }
  }

  function handleReset(assetPath: string): void {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[assetPath];
      return next;
    });
  }

  function handleResetAll(): void {
    setOverrides({});
    setUploadMsg({ text: 'All assets reset to placeholders.', ok: true });
  }

  const isAnyUploading = Object.values(uploading).some(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>
            Assets
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Manage icons, illustrations, OG image, and favicon. Replace any placeholder below.
          </p>
        </div>
        <button
          onClick={handleResetAll}
          style={{ ...actionBtnStyle, fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          title="Reset all assets to defaults"
        >
          <RefreshCw size={12} />
          Reset All
        </button>
      </div>

      {/* Upload feedback */}
      {uploadMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem', borderRadius: '6px',
          background: uploadMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${uploadMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.8rem',
          color: uploadMsg.ok ? '#10b981' : '#f87171',
        }}>
          {uploadMsg.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {uploadMsg.text}
        </div>
      )}

      {/* ── Icons section ── */}
      <Section title="Feature Icons" icon={<LayoutGrid size={14} />} hint="Used in Features page icon grid · 24×24 SVG recommended">
        <div style={gridStyle}>
          {DEFAULT_ICONS.map((asset) => (
            <AssetCard
              key={asset.path}
              asset={asset}
              overrideUrl={overrides[asset.path]}
              onUpload={handleUpload}
              onReset={handleReset}
              uploading={Boolean(uploading[asset.path]) || isAnyUploading}
            />
          ))}
        </div>
      </Section>

      {/* ── Illustrations section ── */}
      <Section title="Illustrations" icon={<Image size={14} />} hint="Hero and section illustrations · 800×500 SVG recommended">
        <div style={gridStyle}>
          {DEFAULT_ILLUSTRATIONS.map((asset) => (
            <AssetCard
              key={asset.path}
              asset={asset}
              overrideUrl={overrides[asset.path]}
              onUpload={handleUpload}
              onReset={handleReset}
              uploading={Boolean(uploading[asset.path]) || isAnyUploading}
            />
          ))}
        </div>
      </Section>

      {/* ── OG Image section ── */}
      <Section title="Open Graph / Social Image" icon={<FileImage size={14} />} hint="Shown when sharing on social media · 1200×630 PNG/SVG">
        <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          <AssetCard
            asset={DEFAULT_OG}
            overrideUrl={overrides[DEFAULT_OG.path]}
            onUpload={handleUpload}
            onReset={handleReset}
            uploading={Boolean(uploading[DEFAULT_OG.path]) || isAnyUploading}
          />
          <AssetCard
            asset={DEFAULT_FAVICON}
            overrideUrl={overrides[DEFAULT_FAVICON.path]}
            onUpload={handleUpload}
            onReset={handleReset}
            uploading={Boolean(uploading[DEFAULT_FAVICON.path]) || isAnyUploading}
          />
        </div>
      </Section>

      {/* Usage notes */}
      <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.6, padding: '0.75rem', background: 'rgba(99,102,241,0.04)', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.1)' }}>
        <strong style={{ color: '#818cf8' }}>How assets work:</strong> Placeholder assets are auto-generated during build and served from{' '}
        <code style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>/icons/</code> and{' '}
        <code style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>/illustrations/</code>.
        Replacements are previewed instantly and uploaded to the server. Re-run a build to
        embed updated asset references in generated pages.
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
        <span style={{ color: '#6366f1' }}>{icon}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>{title}</span>
      </div>
      <p style={{ margin: '0 0 0.65rem', fontSize: '0.72rem', color: '#475569' }}>{hint}</p>
      {children}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(51,65,85,0.5)',
  borderRadius: '8px',
  overflow: 'hidden',
};

const previewBoxStyle: React.CSSProperties = {
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(30,41,59,0.6)',
  borderBottom: '1px solid rgba(51,65,85,0.4)',
  padding: '0.5rem',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.72rem',
  padding: '0.3rem 0.6rem',
  background: 'rgba(99,102,241,0.08)',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: '5px',
  color: '#818cf8',
  cursor: 'pointer',
  transition: 'background 0.15s',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '0.625rem',
};
