"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TableField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
}

interface SchemaTable {
  id: string;
  name: string;
  fields: TableField[];
}

const FIELD_TYPES = [
  "String",
  "Int",
  "Float",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
];

export default function SchemaDesignerPage() {
  const [tables, setTables] = useState<SchemaTable[]>([
    {
      id: "1",
      name: "User",
      fields: [
        { name: "id", type: "String", required: true, unique: true },
        { name: "email", type: "String", required: true, unique: true },
        { name: "name", type: "String", required: false, unique: false },
        { name: "createdAt", type: "DateTime", required: true, unique: false },
      ],
    },
  ]);

  const addTable = () => {
    const id = Date.now().toString();
    setTables((prev) => [
      ...prev,
      { id, name: `Table${prev.length + 1}`, fields: [] },
    ]);
  };

  const removeTable = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTableName = (id: string, name: string) => {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const addField = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: [
                ...t.fields,
                { name: "newField", type: "String", required: false, unique: false },
              ],
            }
          : t
      )
    );
  };

  const updateField = (
    tableId: string,
    idx: number,
    field: Partial<TableField>
  ) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              fields: t.fields.map((f, i) =>
                i === idx ? { ...f, ...field } : f
              ),
            }
          : t
      )
    );
  };

  const removeField = (tableId: string, idx: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, fields: t.fields.filter((_, i) => i !== idx) }
          : t
      )
    );
  };

  const prismaSchema = tables
    .map(
      (t) =>
        `model ${t.name} {\n${t.fields
          .map(
            (f) =>
              `  ${f.name} ${f.type}${f.required ? "" : "?"}${f.unique ? " @unique" : ""}${f.name === "id" ? " @id" : ""}`
          )
          .join("\n")}\n}`
    )
    .join("\n\n");

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            🗃️ Visual Schema Designer
          </h1>
          <button
            onClick={addTable}
            className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2 text-sm hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
                <input
                  value={table.name}
                  onChange={(e) => updateTableName(table.id, e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none"
                />
                <button onClick={() => removeTable(table.id)}>
                  <Trash2 className="w-4 h-4 text-indigo-200 hover:text-white" />
                </button>
              </div>

              <div className="p-3 space-y-2">
                {table.fields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <input
                      value={field.name}
                      onChange={(e) =>
                        updateField(table.id, idx, { name: e.target.value })
                      }
                      className="flex-1 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(table.id, idx, { type: e.target.value })
                      }
                      className="border border-gray-200 rounded px-1 py-1 focus:outline-none"
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft} value={ft}>
                          {ft}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeField(table.id, idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addField(table.id)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 border-l border-gray-200 bg-white p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Prisma Schema Preview
        </h2>
        <pre className="text-xs font-mono text-gray-700 bg-gray-50 rounded-lg p-3 overflow-auto flex-1 whitespace-pre-wrap">
          {prismaSchema}
        </pre>
      </div>
    </div>
  );
}
