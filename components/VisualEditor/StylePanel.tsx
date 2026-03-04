"use client";

import type { CanvasElement, ElementStyles } from "./types";

interface StylePanelProps {
  element: CanvasElement | null;
  onUpdate: (id: string, styles: ElementStyles) => void;
}

interface StyleField {
  key: keyof ElementStyles;
  label: string;
  placeholder: string;
}

const STYLE_FIELDS: StyleField[] = [
  { key: "width", label: "Width", placeholder: "e.g. 100px or 50%" },
  { key: "height", label: "Height", placeholder: "e.g. 40px or auto" },
  { key: "backgroundColor", label: "Background", placeholder: "e.g. #fff or blue" },
  { key: "color", label: "Text Color", placeholder: "e.g. #333 or white" },
  { key: "fontSize", label: "Font Size", placeholder: "e.g. 16px or 1rem" },
  { key: "fontWeight", label: "Font Weight", placeholder: "e.g. 400 or bold" },
  { key: "padding", label: "Padding", placeholder: "e.g. 8px 16px" },
  { key: "margin", label: "Margin", placeholder: "e.g. 0 auto" },
  { key: "borderRadius", label: "Border Radius", placeholder: "e.g. 4px or 50%" },
  { key: "border", label: "Border", placeholder: "e.g. 1px solid #ccc" },
];

export default function StylePanel({ element, onUpdate }: StylePanelProps) {
  if (!element) {
    return (
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-l border-gray-700 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500 text-center">
          Select an element to edit its styles
        </p>
      </aside>
    );
  }

  const handleChange = (key: keyof ElementStyles, value: string) => {
    onUpdate(element.id, { ...element.styles, [key]: value || undefined });
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-900 border-l border-gray-700 overflow-y-auto p-3 flex flex-col gap-3">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1 mb-1">
          Styles
        </h2>
        <p className="text-xs text-blue-400 px-1 truncate">
          {element.type} — {element.id}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {STYLE_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-1">
            <label
              htmlFor={`style-${key}`}
              className="text-xs text-gray-400 font-medium"
            >
              {label}
            </label>
            <input
              id={`style-${key}`}
              type="text"
              value={element.styles[key] ?? ""}
              placeholder={placeholder}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full rounded bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-2 py-1 text-xs text-gray-200 placeholder-gray-600 transition-colors"
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
