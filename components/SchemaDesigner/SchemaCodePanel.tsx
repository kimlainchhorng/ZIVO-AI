"use client";

interface SchemaCodePanelProps {
  schema: string;
}

export default function SchemaCodePanel({ schema }: SchemaCodePanelProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(schema).catch(console.error);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Prisma Schema
        </h3>
        <button
          onClick={handleCopy}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          Copy
        </button>
      </div>
      <pre className="flex-1 text-xs font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-auto whitespace-pre-wrap">
        {schema}
      </pre>
    </div>
  );
}
