"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CanvasElement } from "./types";

const COLORS = {
  bg: "#0a0b14",
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

const ELEMENT_DEFAULT_STYLES: Record<string, React.CSSProperties> = {
  button: { padding: "8px 16px", background: "#6366f1", color: "#fff", borderRadius: "6px", display: "inline-block", fontWeight: 600 },
  card: { padding: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" },
  navbar: { display: "flex", alignItems: "center", padding: "12px 16px", background: "#0f1120", borderBottom: "1px solid rgba(255,255,255,0.08)", width: "100%" },
  footer: { display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 16px", background: "#0a0b14", borderTop: "1px solid rgba(255,255,255,0.08)", width: "100%" },
  text: { color: "#f1f5f9", fontSize: "14px", lineHeight: 1.6 },
  heading: { color: "#f1f5f9", fontSize: "24px", fontWeight: 700 },
  image: { width: "120px", height: "80px", background: "#1e293b", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "12px" },
  badge: { display: "inline-block", padding: "2px 8px", background: "rgba(99,102,241,0.15)", color: "#6366f1", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  avatar: { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 },
  input: { padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f1f5f9", width: "100%" },
  table: { width: "100%", borderCollapse: "collapse", background: "rgba(255,255,255,0.02)" },
  container: { padding: "16px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px", minHeight: "80px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "8px" },
  flexbox: { display: "flex", gap: "8px", padding: "8px", flexWrap: "wrap" as const },
};

interface SortableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableElement({ element, isSelected, onSelect, onDelete }: SortableElementProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const defaultStyle = ELEMENT_DEFAULT_STYLES[element.type] ?? {};
  const mergedStyle: React.CSSProperties = {
    ...defaultStyle,
    ...(element.styles.backgroundColor ? { background: element.styles.backgroundColor } : {}),
    ...(element.styles.color ? { color: element.styles.color } : {}),
    ...(element.styles.fontSize ? { fontSize: element.styles.fontSize } : {}),
    ...(element.styles.padding ? { padding: element.styles.padding } : {}),
    ...(element.styles.margin ? { margin: element.styles.margin } : {}),
    ...(element.styles.borderRadius ? { borderRadius: element.styles.borderRadius } : {}),
    ...(element.styles.width ? { width: element.styles.width } : {}),
    ...(element.styles.height ? { height: element.styles.height } : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
    >
      <div
        style={{
          position: "relative",
          outline: isSelected ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          outlineOffset: "2px",
          borderRadius: "4px",
          transition: "outline 0.1s",
          cursor: "pointer",
        }}
      >
        <div {...attributes} {...listeners} style={{ cursor: "grab" }}>
          <ElementRenderer element={element} mergedStyle={mergedStyle} />
        </div>
        {isSelected && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
            style={{
              position: "absolute", top: "-10px", right: "-10px",
              width: "20px", height: "20px",
              background: "#ef4444", border: "none",
              borderRadius: "50%", color: "#fff",
              fontSize: "10px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function ElementRenderer({ element, mergedStyle }: { element: CanvasElement; mergedStyle: React.CSSProperties }) {
  const label = element.label;
  switch (element.type) {
    case "button":
      return <button style={mergedStyle}>{label}</button>;
    case "badge":
      return <span style={mergedStyle}>{label}</span>;
    case "avatar":
      return <div style={mergedStyle}>{label.charAt(0).toUpperCase()}</div>;
    case "image":
      return <div style={mergedStyle}>🖼 {label}</div>;
    case "navbar":
      return <nav style={mergedStyle}><strong style={{ color: "#6366f1" }}>{label}</strong></nav>;
    case "footer":
      return <footer style={mergedStyle}><span style={{ color: "#94a3b8", fontSize: "12px" }}>{label}</span></footer>;
    case "input":
      return <input placeholder={label} style={mergedStyle} readOnly />;
    case "heading":
      return <h2 style={mergedStyle}>{label}</h2>;
    case "card":
      return <div style={mergedStyle}><p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{label}</p></div>;
    case "container":
    case "grid":
    case "flexbox":
      return (
        <div style={mergedStyle}>
          <span style={{ color: COLORS.textMuted, fontSize: "12px" }}>{element.type}: {label}</span>
        </div>
      );
    default:
      return <div style={{ ...mergedStyle, padding: mergedStyle.padding ?? "8px", color: COLORS.textPrimary, fontSize: "13px" }}>{label}</div>;
  }
}

interface VisualCanvasProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (elements: CanvasElement[]) => void;
  onDelete: (id: string) => void;
  onDrop: (type: string) => void;
}

export default function VisualCanvas({ elements, selectedId, onSelect, onReorder, onDelete, onDrop }: VisualCanvasProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((e) => e.id === active.id);
      const newIndex = elements.findIndex((e) => e.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(elements, oldIndex, newIndex));
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    event.activatorEvent.preventDefault?.();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData("elementType");
    if (type) onDrop(type);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => onSelect(null)}
      style={{
        flex: 1,
        minHeight: "400px",
        border: `2px dashed ${isDragOver ? COLORS.accent : COLORS.border}`,
        borderRadius: "12px",
        background: isDragOver ? "rgba(99,102,241,0.03)" : COLORS.bg,
        padding: "16px",
        transition: "all 0.2s",
        overflowY: "auto",
      }}
    >
      {elements.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "300px", color: COLORS.textMuted, gap: "8px" }}>
          <div style={{ fontSize: "2rem" }}>🎨</div>
          <p style={{ fontSize: "0.875rem", margin: 0 }}>Drag elements here from the palette</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
          <SortableContext items={elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {elements.map((element) => (
                <SortableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedId === element.id}
                  onSelect={onSelect}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
