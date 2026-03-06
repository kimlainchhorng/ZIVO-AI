'use client';

import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { Section, Page } from '@/types/builder';
import {
  exportAsReactComponent,
  exportAsNextjsPage,
  exportAsTailwindComponents,
  exportAsZip,
  generateCopyableCode,
} from '@/lib/export-service';

interface ExportMenuProps {
  projectId: string;
  sections: Section[];
  pages: Page[];
}

type ExportOption = 'react' | 'nextjs' | 'tailwind' | 'copy' | 'zip';

const COLORS = {
  bgPanel: '#0f1120',
  bgItem: 'rgba(255,255,255,0.04)',
  bgItemHover: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

const EXPORT_OPTIONS: { id: ExportOption; label: string; icon: string; desc: string }[] = [
  { id: 'react', label: 'React Component', icon: '⚛️', desc: '.tsx file with components' },
  { id: 'nextjs', label: 'Next.js Page', icon: '▲', desc: 'Full page with Head' },
  { id: 'tailwind', label: 'Tailwind Only', icon: '🎨', desc: 'Pure Tailwind CSS classes' },
  { id: 'copy', label: 'Copy Code', icon: '📋', desc: 'Copy first section to clipboard' },
  { id: 'zip', label: 'Download ZIP', icon: '📦', desc: 'All pages as a project' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportMenu({ sections, pages }: ExportMenuProps) {
  const [loading, setLoading] = useState<ExportOption | null>(null);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = async (option: ExportOption) => {
    setLoading(option);
    try {
      switch (option) {
        case 'react': {
          const code = await exportAsReactComponent(sections);
          downloadBlob(new Blob([code], { type: 'text/plain' }), 'GeneratedPage.tsx');
          break;
        }
        case 'nextjs': {
          const page = pages[0];
          if (!page) break;
          const code = await exportAsNextjsPage(page);
          downloadBlob(new Blob([code], { type: 'text/plain' }), `${page.slug || 'page'}.tsx`);
          break;
        }
        case 'tailwind': {
          const code = await exportAsTailwindComponents(sections);
          downloadBlob(new Blob([code], { type: 'text/plain' }), 'TailwindComponents.tsx');
          break;
        }
        case 'copy': {
          const section = sections[0];
          if (!section) break;
          const code = generateCopyableCode(section);
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          break;
        }
        case 'zip': {
          const blob = await exportAsZip({
            title: pages[0]?.name ?? 'Project',
            pages,
          });
          downloadBlob(blob, 'zivo-project.zip');
          break;
        }
      }
    } catch (err) {
      console.error('[export]', err);
    } finally {
      setLoading(null);
      if (option !== 'copy') setOpen(false);
    }
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.4375rem 0.875rem',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '8px',
            color: COLORS.textPrimary,
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          ↗ Export
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="start"
          style={{
            background: COLORS.bgPanel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '10px',
            padding: '0.375rem',
            minWidth: '220px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: '0.375rem 0.625rem 0.5rem',
              fontSize: '0.625rem',
              fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Export As
          </div>

          {EXPORT_OPTIONS.map((opt) => {
            const isLoading = loading === opt.id;
            const isCopied = opt.id === 'copy' && copied;

            return (
              <DropdownMenu.Item
                key={opt.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleExport(opt.id);
                }}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.625rem',
                  borderRadius: '7px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  outline: 'none',
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = COLORS.bgItemHover;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>
                  {isLoading ? '⏳' : isCopied ? '✓' : opt.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: isCopied ? '#10b981' : COLORS.textPrimary,
                    }}
                  >
                    {isCopied ? 'Copied!' : opt.label}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: COLORS.textMuted }}>{opt.desc}</div>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
