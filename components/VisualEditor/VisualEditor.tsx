"use client";

import { useState, useCallback } from "react";
import ElementPanel from "./ElementPanel";
import StylePanel from "./StylePanel";
import LayerPanel from "./LayerPanel";
import CanvasRenderer from "./CanvasRenderer";
import type {
  CanvasElement,
  DesignState,
  ElementStyles,
  ElementType,
} from "./types";

export type { CanvasElement, DesignState };

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

function findAndUpdate(
  elements: CanvasElement[],
  id: string,
  styles: ElementStyles
): CanvasElement[] {
  return elements.map((el) => {
    if (el.id === id) return { ...el, styles };
    if (el.children) {
      return { ...el, children: findAndUpdate(el.children, id, styles) };
    }
    return el;
  });
}

function findElement(
  elements: CanvasElement[],
  id: string | null
): CanvasElement | null {
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

interface VisualEditorProps {
  onExport?: (elements: CanvasElement[]) => void;
}

export default function VisualEditor({ onExport }: VisualEditorProps) {
  const [state, setState] = useState<DesignState>({
    elements: [],
    selectedId: null,
  });

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData("elementType") as ElementType;
    if (!type) return;
    const newElement: CanvasElement = {
      id: generateId(),
      type,
      label: DEFAULT_LABELS[type] ?? type,
      styles: {},
    };
    setState((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedId: newElement.id,
    }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  const handleStyleUpdate = useCallback(
    (id: string, styles: ElementStyles) => {
      setState((prev) => ({
        ...prev,
        elements: findAndUpdate(prev.elements, id, styles),
      }));
    },
    []
  );

  const handleExport = () => {
    onExport?.(state.elements);
  };

  const handleClear = () => {
    setState({ elements: [], selectedId: null });
  };

  const selectedElement = findElement(state.elements, state.selectedId);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-white">
            🎨 Visual Editor
          </span>
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
            ZIVO-AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {state.elements.length} element
            {state.elements.length !== 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Export to Code
          </button>
        </div>
      </header>

      {/* Three-column body */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Element Panel */}
        <ElementPanel />

        {/* Center: Canvas Drop Zone */}
        <main
          className={`flex-1 relative overflow-hidden transition-colors ${
            isDragOver
              ? "bg-blue-950 border-2 border-dashed border-blue-500"
              : "bg-gray-950"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() =>
            setState((prev) => ({ ...prev, selectedId: null }))
          }
        >
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <p className="text-blue-400 text-sm font-medium bg-blue-950/80 px-4 py-2 rounded-lg border border-blue-500">
                Release to add element
              </p>
            </div>
          )}
          <CanvasRenderer
            elements={state.elements}
            selectedId={state.selectedId}
            onSelect={handleSelect}
          />
        </main>

        {/* Right: Style Panel + Layer Panel stacked */}
        <div className="flex flex-col w-56 flex-shrink-0 border-l border-gray-700 divide-y divide-gray-700">
          <StylePanel element={selectedElement} onUpdate={handleStyleUpdate} />
          <LayerPanel
            elements={state.elements}
            selectedId={state.selectedId}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
