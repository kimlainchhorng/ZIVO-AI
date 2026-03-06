"use client";

import { useDraggable } from "@dnd-kit/core";
import type { ElementType } from "./types";

const COLORS = {
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface PaletteItem {
  type: ElementType;
  label: string;
  emoji: string;
}

interface PaletteCategory {
  name: string;
  items: PaletteItem[];
}

const CATEGORIES: PaletteCategory[] = [
  {
    name: "Layout",
    items: [
      { type: "container", label: "Container", emoji: "📦" },
      { type: "grid", label: "Grid", emoji: "⚏" },
      { type: "flexbox", label: "Flexbox", emoji: "⇌" },
    ],
  },
  {
    name: "UI",
    items: [
      { type: "button", label: "Button", emoji: "🔘" },
      { type: "card", label: "Card", emoji: "🃏" },
      { type: "badge", label: "Badge", emoji: "🏷" },
      { type: "avatar", label: "Avatar", emoji: "👤" },
      { type: "modal", label: "Modal", emoji: "🪟" },
    ],
  },
  {
    name: "Navigation",
    items: [
      { type: "navbar", label: "Navbar", emoji: "🗂" },
      { type: "sidebar", label: "Sidebar", emoji: "📑" },
      { type: "footer", label: "Footer", emoji: "📋" },
    ],
  },
  {
    name: "Forms",
    items: [
      { type: "form", label: "Form", emoji: "📝" },
      { type: "input", label: "Input", emoji: "⌨" },
      { type: "select", label: "Select", emoji: "🔽" },
      { type: "checkbox", label: "Checkbox", emoji: "☑" },
      { type: "radio", label: "Radio", emoji: "🔵" },
    ],
  },
  {
    name: "Content",
    items: [
      { type: "text", label: "Text", emoji: "📄" },
      { type: "heading", label: "Heading", emoji: "H" },
      { type: "image", label: "Image", emoji: "🖼" },
      { type: "icon", label: "Icon", emoji: "⭐" },
    ],
  },
  {
    name: "Data",
    items: [
      { type: "table", label: "Table", emoji: "📊" },
      { type: "chart", label: "Chart", emoji: "📈" },
    ],
  },
];

function DraggableChip({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette-${item.type}`, data: { type: item.type } });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("elementType", item.type)}
      style={{
        padding: "6px 10px",
        background: isDragging ? "rgba(99,102,241,0.2)" : COLORS.bgCard,
        border: `1px solid ${isDragging ? "rgba(99,102,241,0.4)" : COLORS.border}`,
        borderRadius: "6px",
        cursor: "grab",
        fontSize: "0.75rem",
        color: COLORS.textSecondary,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        transition: "all 0.15s",
        userSelect: "none",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span>{item.emoji}</span>
      <span>{item.label}</span>
    </div>
  );
}

export default function ElementPalette() {
  return (
    <div
      style={{
        width: "200px",
        flexShrink: 0,
        background: COLORS.bgPanel,
        borderRight: `1px solid ${COLORS.border}`,
        overflowY: "auto",
        padding: "12px",
      }}
    >
      <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
        Elements
      </p>
      {CATEGORIES.map((category) => (
        <div key={category.name} style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: COLORS.textMuted, margin: "0 0 6px", letterSpacing: "0.04em" }}>
            {category.name}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {category.items.map((item) => (
              <DraggableChip key={item.type} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
