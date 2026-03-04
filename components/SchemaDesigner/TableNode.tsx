"use client";

interface TableNodeProps {
  id: string;
  name: string;
  fields: Array<{ name: string; type: string; required: boolean; unique: boolean }>;
  selected?: boolean;
  onClick?: () => void;
}

export default function TableNode({ name, fields, selected, onClick }: TableNodeProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border shadow-sm overflow-hidden cursor-pointer transition-all ${
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="bg-indigo-600 text-white px-4 py-2 text-sm font-medium">
        {name}
      </div>
      <div className="bg-white divide-y divide-gray-100">
        {fields.map((f, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-1.5 text-xs">
            <span className="text-gray-800">{f.name}</span>
            <span className="text-gray-400">{f.type}{f.required ? "" : "?"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
