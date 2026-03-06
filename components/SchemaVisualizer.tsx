"use client";

import { useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  foreignKey?: string; // "TableName.fieldName"
}

export interface SchemaTableDef {
  id: string;
  name: string;
  fields: SchemaField[];
}

interface Position {
  x: number;
  y: number;
}

// ─── Layout constants ──────────────────────────────────────────────────────────

const TABLE_WIDTH = 220;
const HEADER_HEIGHT = 36;
const ROW_HEIGHT = 26;
const TABLE_GAP_X = 280;
const TABLE_GAP_Y = 60;

function tableHeight(table: SchemaTableDef): number {
  return HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + 8;
}

function autoLayout(tables: SchemaTableDef[]): Map<string, Position> {
  const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)));
  const positions = new Map<string, Position>();
  tables.forEach((t, i) => {
    positions.set(t.id, {
      x: 40 + (i % cols) * TABLE_GAP_X,
      y: 40 + Math.floor(i / cols) * (200 + TABLE_GAP_Y),
    });
  });
  return positions;
}

// ─── Relation arrow helper ─────────────────────────────────────────────────────

interface RelationEdge {
  fromTable: string;
  fromField: string;
  toTable: string;
  toField: string;
}

function getEdges(tables: SchemaTableDef[]): RelationEdge[] {
  const edges: RelationEdge[] = [];
  for (const table of tables) {
    for (const field of table.fields) {
      if (field.foreignKey) {
        const [toTable, toField] = field.foreignKey.split(".");
        if (toTable && toField) {
          edges.push({
            fromTable: table.id,
            fromField: field.name,
            toTable,
            toField,
          });
        }
      }
    }
  }
  return edges;
}

function getFieldY(table: SchemaTableDef, fieldName: string, pos: Position): number {
  const idx = table.fields.findIndex((f) => f.name === fieldName);
  return pos.y + HEADER_HEIGHT + (idx >= 0 ? idx : 0) * ROW_HEIGHT + ROW_HEIGHT / 2;
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SchemaVisualizerProps {
  tables: SchemaTableDef[];
  className?: string;
}

export default function SchemaVisualizer({ tables, className = "" }: SchemaVisualizerProps) {
  const [positions, setPositions] = useState<Map<string, Position>>(() => autoLayout(tables));
  const [zoom, setZoom] = useState(1);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Recalculate layout when tables change
  const resetLayout = useCallback(() => {
    setPositions(autoLayout(tables));
  }, [tables]);

  // Compute SVG viewport
  const allPositions = tables.map((t) => positions.get(t.id) ?? { x: 40, y: 40 });
  const maxX = Math.max(...allPositions.map((p) => p.x)) + TABLE_WIDTH + 60;
  const maxY = Math.max(...allPositions.map((p, i) => p.y + tableHeight(tables[i]))) + 60;
  const viewWidth = Math.max(800, maxX);
  const viewHeight = Math.max(500, maxY);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const pos = positions.get(id) ?? { x: 0, y: 0 };
    dragging.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const { id, startX, startY, origX, origY } = dragging.current;
    const dx = (e.clientX - startX) / zoom;
    const dy = (e.clientY - startY) / zoom;
    setPositions((prev) => {
      const next = new Map(prev);
      next.set(id, { x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) });
      return next;
    });
  };

  const onMouseUp = () => {
    dragging.current = null;
  };

  const edges = getEdges(tables);
  const tableById = new Map(tables.map((t) => [t.id, t]));
  const tableByName = new Map(tables.map((t) => [t.name, t]));

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70"
        >
          Zoom +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70"
        >
          Zoom −
        </button>
        <button
          onClick={resetLayout}
          className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70"
        >
          Reset Layout
        </button>
        <span className="text-xs text-white/30 ml-auto">
          {Math.round(zoom * 100)}% · {tables.length} tables
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="overflow-auto rounded-xl border border-white/10 bg-[#0a0b14]">
        <svg
          ref={svgRef}
          width={viewWidth * zoom}
          height={viewHeight * zoom}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ display: "block" }}
        >
          {/* Relation arrows */}
          <g stroke="#6366f1" strokeWidth="1.5" fill="none" opacity="0.6">
            {edges.map((edge, i) => {
              const fromTable = tableById.get(edge.fromTable);
              const toTable = tableByName.get(edge.toTable);
              if (!fromTable || !toTable) return null;

              const fromPos = positions.get(edge.fromTable) ?? { x: 0, y: 0 };
              const toPos = positions.get(toTable.id) ?? { x: 0, y: 0 };

              const isSelected =
                selectedTable === edge.fromTable || selectedTable === toTable.id;

              const x1 = fromPos.x + TABLE_WIDTH;
              const y1 = getFieldY(fromTable, edge.fromField, fromPos);
              const x2 = toPos.x;
              const y2 = getFieldY(toTable, edge.toField, toPos);

              const cx = (x1 + x2) / 2;

              return (
                <g key={i} opacity={isSelected ? 1 : 0.5}>
                  <path
                    d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                    stroke={isSelected ? "#a5b4fc" : "#6366f1"}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  {/* Arrow head */}
                  <polygon
                    points={`${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`}
                    fill={isSelected ? "#a5b4fc" : "#6366f1"}
                  />
                </g>
              );
            })}
          </g>

          {/* Tables */}
          {tables.map((table) => {
            const pos = positions.get(table.id) ?? { x: 40, y: 40 };
            const h = tableHeight(table);
            const isSelected = selectedTable === table.id;

            return (
              <g
                key={table.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{ cursor: "grab" }}
                onMouseDown={(e) => onMouseDown(e, table.id)}
                onClick={() =>
                  setSelectedTable((prev) => (prev === table.id ? null : table.id))
                }
              >
                {/* Table shadow */}
                <rect
                  x={2}
                  y={2}
                  width={TABLE_WIDTH}
                  height={h}
                  rx={8}
                  fill="rgba(0,0,0,0.4)"
                />

                {/* Table body */}
                <rect
                  width={TABLE_WIDTH}
                  height={h}
                  rx={8}
                  fill={isSelected ? "#1e1f38" : "#141526"}
                  stroke={isSelected ? "#6366f1" : "rgba(255,255,255,0.12)"}
                  strokeWidth={isSelected ? 1.5 : 1}
                />

                {/* Header */}
                <rect
                  width={TABLE_WIDTH}
                  height={HEADER_HEIGHT}
                  rx={8}
                  fill={isSelected ? "#4f46e5" : "#3730a3"}
                />
                <rect
                  y={HEADER_HEIGHT - 8}
                  width={TABLE_WIDTH}
                  height={8}
                  fill={isSelected ? "#4f46e5" : "#3730a3"}
                />
                <text
                  x={TABLE_WIDTH / 2}
                  y={HEADER_HEIGHT / 2 + 5}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="system-ui, sans-serif"
                >
                  {table.name}
                </text>

                {/* Fields */}
                {table.fields.map((field, fi) => {
                  const fy = HEADER_HEIGHT + fi * ROW_HEIGHT + 4;
                  const isPK = field.primaryKey;
                  const isFK = Boolean(field.foreignKey);
                  return (
                    <g key={fi}>
                      {/* Row hover bg (every other row) */}
                      {fi % 2 === 0 && (
                        <rect
                          y={HEADER_HEIGHT + fi * ROW_HEIGHT}
                          width={TABLE_WIDTH}
                          height={ROW_HEIGHT}
                          fill="rgba(255,255,255,0.02)"
                        />
                      )}
                      {/* PK indicator */}
                      {isPK && (
                        <text x={8} y={fy + 14} fontSize={9} fill="#fbbf24" fontFamily="monospace">
                          🔑
                        </text>
                      )}
                      {/* FK indicator */}
                      {isFK && !isPK && (
                        <text x={8} y={fy + 14} fontSize={9} fill="#60a5fa" fontFamily="monospace">
                          🔗
                        </text>
                      )}
                      {/* Field name */}
                      <text
                        x={isPK || isFK ? 26 : 12}
                        y={fy + 14}
                        fontSize={11}
                        fill={isPK ? "#fde68a" : isFK ? "#93c5fd" : "rgba(255,255,255,0.8)"}
                        fontFamily="ui-monospace, monospace"
                      >
                        {field.name}
                        {field.required ? "" : "?"}
                      </text>
                      {/* Field type */}
                      <text
                        x={TABLE_WIDTH - 8}
                        y={fy + 14}
                        textAnchor="end"
                        fontSize={10}
                        fill="rgba(99,102,241,0.9)"
                        fontFamily="ui-monospace, monospace"
                      >
                        {field.type}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
