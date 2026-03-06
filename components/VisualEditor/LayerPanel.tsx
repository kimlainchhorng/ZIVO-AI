"use client";

import type { CanvasElement } from "./types";

interface LayerPanelProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

interface LayerItemProps {
  element: CanvasElement;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function LayerItem({ element, depth, selectedId, onSelect }: LayerItemProps) {
  const isSelected = element.id === selectedId;

  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(element.id)}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        className={`w-full flex items-center gap-2 py-1.5 pr-2 text-left rounded transition-colors text-xs ${
          isSelected
            ? "bg-blue-600 text-white"
            : "text-gray-300 hover:bg-gray-700"
        }`}
      >
        <span className="truncate font-medium">{element.type}</span>
        <span
          className={`ml-auto font-mono truncate text-[10px] ${
            isSelected ? "text-blue-200" : "text-gray-500"
          }`}
        >
          #{element.id.slice(0, 6)}
        </span>
      </button>
      {element.children?.map((child) => (
        <LayerItem
          key={child.id}
          element={child}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export default function LayerPanel({
  elements,
  selectedId,
  onSelect,
}: LayerPanelProps) {
  return (
    <div className="flex-1 bg-gray-900 border-l border-gray-700 overflow-y-auto p-2 flex flex-col gap-1 min-h-0">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1 mb-1 flex-shrink-0">
        Layers
      </h2>
      {elements.length === 0 ? (
        <p className="text-xs text-gray-600 px-1 mt-2">No layers yet</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {elements.map((el) => (
            <LayerItem
              key={el.id}
              element={el}
              depth={0}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
