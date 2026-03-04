"use client";

import type { ElementType } from "./types";

interface PanelItem {
  type: ElementType;
  label: string;
  emoji: string;
}

const CATEGORIES: { name: string; items: PanelItem[] }[] = [
  {
    name: "Basic",
    items: [
      { type: "text", label: "Text", emoji: "📝" },
      { type: "heading", label: "Heading", emoji: "🔤" },
      { type: "button", label: "Button", emoji: "🔘" },
      { type: "image", label: "Image", emoji: "🖼️" },
      { type: "icon", label: "Icon", emoji: "⭐" },
    ],
  },
  {
    name: "Layout",
    items: [
      { type: "container", label: "Container", emoji: "📦" },
      { type: "grid", label: "Grid", emoji: "▦" },
      { type: "flexbox", label: "Flexbox", emoji: "↔️" },
    ],
  },
  {
    name: "UI Components",
    items: [
      { type: "card", label: "Card", emoji: "🃏" },
      { type: "modal", label: "Modal", emoji: "🪟" },
      { type: "navbar", label: "Navbar", emoji: "🧭" },
      { type: "footer", label: "Footer", emoji: "🦶" },
      { type: "sidebar", label: "Sidebar", emoji: "📋" },
    ],
  },
  {
    name: "Form",
    items: [
      { type: "form", label: "Form", emoji: "📄" },
      { type: "input", label: "Input", emoji: "✏️" },
      { type: "select", label: "Select", emoji: "🔽" },
      { type: "checkbox", label: "Checkbox", emoji: "☑️" },
      { type: "radio", label: "Radio", emoji: "🔵" },
    ],
  },
  {
    name: "Data",
    items: [
      { type: "chart", label: "Chart", emoji: "📊" },
      { type: "table", label: "Table", emoji: "📑" },
      { type: "badge", label: "Badge", emoji: "🏷️" },
      { type: "avatar", label: "Avatar", emoji: "👤" },
    ],
  },
];

export default function ElementPanel() {
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    type: ElementType
  ) => {
    e.dataTransfer.setData("elementType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-700 overflow-y-auto p-3 flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1">
        Elements
      </h2>
      {CATEGORIES.map((category) => (
        <div key={category.name}>
          <p className="text-xs font-medium text-gray-500 mb-2 px-1">
            {category.name}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {category.items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 cursor-grab active:cursor-grabbing transition-colors select-none"
                title={`Drag to add ${item.label}`}
              >
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-[10px] text-gray-300 text-center leading-tight">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
