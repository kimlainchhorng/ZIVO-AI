"use client";

import type { CanvasElement, ElementStyles } from "./types";

interface CanvasRendererProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface ElementNodeProps {
  element: CanvasElement;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const DEFAULT_STYLES: Record<string, React.CSSProperties> = {
  text: { fontSize: "14px", color: "#e5e7eb" },
  heading: { fontSize: "24px", fontWeight: "700", color: "#f9fafb" },
  button: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    border: "none",
    display: "inline-block",
  },
  image: {
    width: "120px",
    height: "80px",
    backgroundColor: "#374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "12px",
    borderRadius: "4px",
  },
  icon: { fontSize: "24px" },
  container: {
    padding: "12px",
    border: "1px dashed #4b5563",
    borderRadius: "4px",
    minHeight: "48px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "8px",
    padding: "8px",
    border: "1px dashed #4b5563",
    borderRadius: "4px",
  },
  flexbox: {
    display: "flex",
    gap: "8px",
    padding: "8px",
    border: "1px dashed #4b5563",
    borderRadius: "4px",
  },
  card: {
    padding: "16px",
    backgroundColor: "#1f2937",
    borderRadius: "8px",
    border: "1px solid #374151",
  },
  modal: {
    padding: "20px",
    backgroundColor: "#1f2937",
    borderRadius: "12px",
    border: "1px solid #4b5563",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    minWidth: "240px",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#111827",
    borderBottom: "1px solid #374151",
    width: "100%",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#111827",
    borderTop: "1px solid #374151",
    width: "100%",
  },
  sidebar: {
    padding: "12px",
    backgroundColor: "#1f2937",
    borderRight: "1px solid #374151",
    minHeight: "80px",
    minWidth: "120px",
  },
  form: {
    padding: "12px",
    border: "1px dashed #4b5563",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  input: {
    padding: "6px 10px",
    backgroundColor: "#374151",
    border: "1px solid #4b5563",
    borderRadius: "4px",
    color: "#e5e7eb",
    fontSize: "13px",
    display: "block",
    width: "160px",
  },
  select: {
    padding: "6px 10px",
    backgroundColor: "#374151",
    border: "1px solid #4b5563",
    borderRadius: "4px",
    color: "#e5e7eb",
    fontSize: "13px",
    width: "160px",
  },
  checkbox: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#e5e7eb" },
  radio: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#e5e7eb" },
  chart: {
    width: "180px",
    height: "100px",
    backgroundColor: "#1f2937",
    borderRadius: "8px",
    border: "1px solid #374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "12px",
  },
  table: {
    borderCollapse: "collapse",
    fontSize: "12px",
    color: "#e5e7eb",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "600",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#4b5563",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e5e7eb",
    fontSize: "16px",
  },
};

function buildInlineStyle(
  base: React.CSSProperties,
  overrides: ElementStyles
): React.CSSProperties {
  return { ...base, ...(overrides as React.CSSProperties) };
}

function ElementNode({ element, selectedId, onSelect }: ElementNodeProps) {
  const isSelected = element.id === selectedId;
  const baseStyle = DEFAULT_STYLES[element.type] ?? {};
  const inlineStyle = buildInlineStyle(baseStyle, element.styles);
  const selectedOutline: React.CSSProperties = isSelected
    ? { outline: "2px solid #3b82f6", outlineOffset: "2px" }
    : {};

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
  };

  const childNodes = element.children?.map((child) => (
    <ElementNode
      key={child.id}
      element={child}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  ));

  const combinedStyle: React.CSSProperties = { ...inlineStyle, ...selectedOutline };

  switch (element.type) {
    case "text":
      return (
        <p style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {element.props?.content ?? element.label}
        </p>
      );

    case "heading":
      return (
        <h2 style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {element.props?.content ?? element.label}
        </h2>
      );

    case "button":
      return (
        <button
          type="button"
          style={combinedStyle}
          onClick={handleClick}
          className="cursor-pointer"
        >
          {element.props?.content ?? element.label}
        </button>
      );

    case "image":
      return (
        <div style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {element.props?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={element.props.src}
              alt={element.props?.alt ?? element.label}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "🖼️ Image"
          )}
        </div>
      );

    case "icon":
      return (
        <span style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {element.props?.icon ?? "⭐"}
        </span>
      );

    case "input":
      return (
        <input
          type="text"
          placeholder={element.props?.placeholder ?? element.label}
          style={combinedStyle}
          onClick={handleClick}
          readOnly
          className="cursor-pointer"
        />
      );

    case "select":
      return (
        <select style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          <option>{element.props?.placeholder ?? element.label}</option>
        </select>
      );

    case "checkbox":
      return (
        <label style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          <input type="checkbox" readOnly className="mr-1" />
          {element.props?.label ?? element.label}
        </label>
      );

    case "radio":
      return (
        <label style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          <input type="radio" readOnly className="mr-1" />
          {element.props?.label ?? element.label}
        </label>
      );

    case "chart":
      return (
        <div style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          📊 Chart
        </div>
      );

    case "table":
      return (
        <table style={combinedStyle} onClick={handleClick} className="cursor-pointer border border-gray-600">
          <thead>
            <tr>
              <th className="border border-gray-600 px-3 py-1 bg-gray-800">Col A</th>
              <th className="border border-gray-600 px-3 py-1 bg-gray-800">Col B</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-600 px-3 py-1">Cell</td>
              <td className="border border-gray-600 px-3 py-1">Cell</td>
            </tr>
          </tbody>
        </table>
      );

    case "badge":
      return (
        <span style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {element.props?.content ?? element.label}
        </span>
      );

    case "avatar":
      return (
        <div style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {element.props?.initials ?? "👤"}
        </div>
      );

    case "navbar":
      return (
        <nav style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          <span className="text-white font-semibold text-sm">
            {element.props?.brand ?? "Brand"}
          </span>
          {childNodes}
        </nav>
      );

    case "footer":
      return (
        <footer style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          <span className="text-gray-400 text-xs">
            {element.props?.content ?? "© 2026 ZIVO-AI"}
          </span>
          {childNodes}
        </footer>
      );

    default:
      // container, grid, flexbox, card, modal, sidebar, form
      return (
        <div style={combinedStyle} onClick={handleClick} className="cursor-pointer">
          {childNodes && childNodes.length > 0 ? (
            childNodes
          ) : (
            <span className="text-xs text-gray-500 select-none">{element.label}</span>
          )}
        </div>
      );
  }
}

export default function CanvasRenderer({
  elements,
  selectedId,
  onSelect,
}: CanvasRendererProps) {
  if (elements.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 select-none pointer-events-none">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">🎨</span>
          <p className="text-sm">Drop elements here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-3 p-4 overflow-auto">
      {elements.map((el) => (
        <ElementNode
          key={el.id}
          element={el}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
