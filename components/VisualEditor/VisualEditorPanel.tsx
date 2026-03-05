"use client";

import { useState, useCallback, useEffect } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import ElementPalette from "./ElementPalette";
import VisualCanvas from "./VisualCanvas";
import PropertyInspector from "./PropertyInspector";
import type { CanvasElement, DesignState, ElementStyles, ElementType } from "./types";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

const DEFAULT_LABELS: Record<ElementType, string> = {
  text: "Text Block",
  heading: "Heading",
  button: "Button",
  image: "Image",
  icon: "Icon",
  container: "Container",
  grid: "Grid",
  flexbox: "Flexbox",
  card: "Card",
  modal: "Modal",
  navbar: "Navbar",
  footer: "Footer",
  sidebar: "Sidebar",
  form: "Form",
  input: "Input",
  select: "Select",
  checkbox: "Checkbox",
  radio: "Radio",
  chart: "Chart",
  table: "Table",
  badge: "Badge",
  avatar: "Avatar",
};

function generateId(): string {
  return Math.random().toString(36).slice(2);
}

function findElement(elements: CanvasElement[], id: string | null): CanvasElement | null {
  if (!id) return null;
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children) {
      const found = findElement(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateElement(
  elements: CanvasElement[],
  id: string,
  styles: ElementStyles,
  label: string
): CanvasElement[] {
  return elements.map((el) => {
    if (el.id === id) return { ...el, styles, label };
    if (el.children) return { ...el, children: updateElement(el.children, id, styles, label) };
    return el;
  });
}

function deleteElement(elements: CanvasElement[], id: string): CanvasElement[] {
  return elements.filter((el) => el.id !== id).map((el) => {
    if (el.children) return { ...el, children: deleteElement(el.children, id) };
    return el;
  });
}

interface VisualEditorPanelProps {
  onCodeGenerated?: (code: string, filename: string) => void;
}

export default function VisualEditorPanel({ onCodeGenerated }: VisualEditorPanelProps) {
  const [state, setState] = useState<DesignState>({ elements: [], selectedId: null });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const addElement = useCallback((type: string) => {
    const elType = type as ElementType;
    const newElement: CanvasElement = {
      id: generateId(),
      type: elType,
      label: DEFAULT_LABELS[elType] ?? elType,
      styles: {},
    };
    setState((prev) => ({
      elements: [...prev.elements, newElement],
      selectedId: newElement.id,
    }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active } = event;
    const id = String(active.id);
    if (id.startsWith("palette-")) {
      const type = id.replace("palette-", "");
      addElement(type);
    }
  }, [addElement]);

  const handleDelete = useCallback((id: string) => {
    setState((prev) => ({
      elements: deleteElement(prev.elements, id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }));
  }, []);

  const handleUpdate = useCallback((id: string, styles: ElementStyles, label: string) => {
    setState((prev) => ({
      ...prev,
      elements: updateElement(prev.elements, id, styles, label),
    }));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === "Delete" || e.key === "Backspace") && state.selectedId) {
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;
      handleDelete(state.selectedId);
    }
  }, [state.selectedId, handleDelete]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleGenerateCode = async () => {
    if (state.elements.length === 0) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/visual-to-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: state.elements }),
      });
      const data = await res.json() as { code?: string; filename?: string; error?: string };
      if (data.error) {
        setError(data.error);
      } else if (data.code) {
        onCodeGenerated?.(data.code, data.filename ?? 'Component.tsx');
      }
    } catch {
      setError('Failed to generate code. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedElement = findElement(state.elements, state.selectedId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: COLORS.bg }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 1rem", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgPanel, flexShrink: 0 }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: COLORS.textPrimary }}>Visual Canvas</span>
        <div style={{ width: "1px", height: "16px", background: COLORS.border }} />
        <span style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{state.elements.length} element{state.elements.length !== 1 ? 's' : ''}</span>
        <div style={{ flex: 1 }} />
        {error && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</span>}
        <button
          onClick={() => setState({ elements: [], selectedId: null })}
          disabled={state.elements.length === 0}
          style={{ padding: "0.3125rem 0.875rem", background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: "6px", color: COLORS.textSecondary, cursor: state.elements.length === 0 ? "not-allowed" : "pointer", fontSize: "0.8125rem", opacity: state.elements.length === 0 ? 0.5 : 1 }}
        >
          Clear
        </button>
        <button
          onClick={handleGenerateCode}
          disabled={generating || state.elements.length === 0}
          style={{ padding: "0.3125rem 0.875rem", background: generating ? 'rgba(99,102,241,0.5)' : COLORS.accentGradient, border: "none", borderRadius: "6px", color: "#fff", cursor: generating || state.elements.length === 0 ? "not-allowed" : "pointer", fontSize: "0.8125rem", fontWeight: 600 }}
        >
          {generating ? "⏳ Generating…" : "⬇ Generate Code"}
        </button>
      </div>

      {/* Main content */}
      <DndContext onDragEnd={handleDragEnd}>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <ElementPalette />
          <div style={{ flex: 1, padding: "16px", overflowY: "auto" }}>
            <VisualCanvas
              elements={state.elements}
              selectedId={state.selectedId}
              onSelect={(id) => setState((prev) => ({ ...prev, selectedId: id }))}
              onReorder={(elements) => setState((prev) => ({ ...prev, elements }))}
              onDelete={handleDelete}
              onDrop={addElement}
            />
          </div>
          <PropertyInspector element={selectedElement} onChange={handleUpdate} />
        </div>
      </DndContext>
    </div>
  );
}
