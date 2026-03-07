'use client';

import React, { useMemo, useState } from 'react';

interface FileEntry {
  path: string;
  content: string;
  action?: 'create' | 'update' | 'delete';
}

interface FileTreeProps {
  files: FileEntry[];
  onFileSelect?: (file: FileEntry) => void;
  activeFile?: string | null;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
  file?: FileEntry;
  size?: number;
}

const COLORS = {
  bg: '#0a0b14',
  bgCard: 'rgba(255,255,255,0.04)',
  bgHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

function getFileTypeColor(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return '#60a5fa'; // blue
    case 'ts':
    case 'js':
      return '#fbbf24'; // yellow
    case 'css':
    case 'scss':
    case 'sass':
      return '#c084fc'; // purple
    case 'json':
      return '#34d399'; // green
    case 'md':
    case 'mdx':
      return '#94a3b8'; // gray
    case 'html':
      return '#fb923c'; // orange
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return '#f472b6'; // pink
    case 'env':
      return '#fbbf24'; // yellow
    default:
      return '#94a3b8'; // gray
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TreeNodeWithMap extends TreeNode {
  _childMap?: Record<string, TreeNodeWithMap>;
}

/** Build a tree structure from flat file paths */
function buildTree(files: FileEntry[]): TreeNode[] {
  const root: Record<string, TreeNodeWithMap> = {};

  for (const file of files) {
    const parts = file.path.replace(/\\/g, '/').split('/').filter(Boolean);
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          isDir: !isLast,
          children: [],
          size: isLast ? new TextEncoder().encode(file.content).length : undefined,
          file: isLast ? file : undefined,
        };
      }

      if (!isLast) {
        const node = current[part];
        if (!node._childMap) {
          node._childMap = {};
          for (const child of node.children as TreeNodeWithMap[]) {
            node._childMap[child.name] = child;
          }
        }
        current = node._childMap;
      }
    }
  }

  function flattenMap(map: Record<string, TreeNodeWithMap>): TreeNode[] {
    return Object.values(map).map((node) => {
      if (node._childMap) {
        node.children = flattenMap(node._childMap);
        delete node._childMap;
      }
      // Sort: dirs first, then files alphabetically
      node.children.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return node;
    }).sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  return flattenMap(root);
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {open ? (
        <>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </>
      ) : (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      )}
    </svg>
  );
}

function TreeNodeRow({
  node,
  depth,
  onFileSelect,
  activeFile,
  filter,
}: {
  node: TreeNode;
  depth: number;
  onFileSelect?: (file: FileEntry) => void;
  activeFile?: string | null;
  filter: string;
}) {
  const [open, setOpen] = useState(depth < 2);

  const isActive = !node.isDir && activeFile === node.path;
  const fileColor = node.isDir ? COLORS.warning : getFileTypeColor(node.name);

  // Filter: if a filter is active, only show nodes that match
  const filterLower = filter.toLowerCase();
  if (filterLower) {
    const nodeMatches = node.name.toLowerCase().includes(filterLower) || node.path.toLowerCase().includes(filterLower);
    const childrenMatch = node.children.some(
      (c) => c.name.toLowerCase().includes(filterLower) || c.path.toLowerCase().includes(filterLower)
    );
    if (!nodeMatches && !childrenMatch) return null;
  }

  return (
    <div>
      <div
        onClick={() => {
          if (node.isDir) {
            setOpen((v) => !v);
          } else if (node.file && onFileSelect) {
            onFileSelect(node.file);
          }
        }}
        className="zivo-file"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.5rem',
          paddingLeft: `${0.5 + depth * 0.875}rem`,
          cursor: 'pointer',
          borderRadius: '4px',
          background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
          border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
          marginBottom: '1px',
          transition: 'background 0.1s',
        }}
      >
        {node.isDir ? (
          <>
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke={COLORS.textMuted}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <FolderIcon open={open} />
          </>
        ) : (
          <>
            <span style={{ width: 9, flexShrink: 0 }} />
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '2px',
                background: fileColor,
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
          </>
        )}
        <span
          style={{
            fontSize: '0.8rem',
            color: isActive ? COLORS.textPrimary : node.isDir ? COLORS.textSecondary : COLORS.textSecondary,
            fontWeight: node.isDir ? 500 : 400,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.name}
        </span>
        {node.size !== undefined && (
          <span style={{ fontSize: '0.65rem', color: COLORS.textMuted, flexShrink: 0 }}>
            {formatBytes(node.size)}
          </span>
        )}
      </div>

      {node.isDir && open && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              activeFile={activeFile}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree({ files, onFileSelect, activeFile }: FileTreeProps) {
  const [filter, setFilter] = useState('');
  const tree = useMemo(() => buildTree(files), [files]);

  if (files.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.75rem',
          borderBottom: `1px solid ${COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={COLORS.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.textSecondary, flex: 1 }}>Files</span>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '1px 7px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '20px',
            color: COLORS.accent,
            fontWeight: 700,
          }}
        >
          {files.length}
        </span>
      </div>

      {/* Search / Filter */}
      <div style={{ padding: '0.4rem 0.75rem', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.textMuted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter files…"
            style={{
              width: '100%',
              padding: '0.3rem 0.5rem 0.3rem 1.75rem',
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              color: COLORS.textSecondary,
              fontSize: '0.75rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              style={{
                position: 'absolute',
                right: '0.4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: COLORS.textMuted,
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.25rem' }}>
        {tree.map((node) => (
          <TreeNodeRow
            key={node.path}
            node={node}
            depth={0}
            onFileSelect={onFileSelect}
            activeFile={activeFile}
            filter={filter}
          />
        ))}
        {files.length > 0 && filter && tree.every((node) => {
          const fl = filter.toLowerCase();
          return !node.name.toLowerCase().includes(fl) && !node.path.toLowerCase().includes(fl) && !node.children.some(c => c.name.toLowerCase().includes(fl));
        }) && (
          <div style={{ padding: '1rem', textAlign: 'center', color: COLORS.textMuted, fontSize: '0.8rem' }}>
            No files match &quot;{filter}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
