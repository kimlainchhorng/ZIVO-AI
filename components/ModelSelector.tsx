"use client";

import React, { useState } from "react";
import { SUPPORTED_MODELS, MODEL_ROUTING, type ModelConfig, type TaskType } from "@/lib/ai/model-router";

// ─── New ModelOption interface (standalone, without model-router dependency) ──

export interface ModelOption {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  quality: "fast" | "medium" | "high";
  costPer1k: number;
  description?: string;
}

export const DEFAULT_MODELS: ModelOption[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    quality: "high",
    costPer1k: 0.005,
    description: "Best for most tasks",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    quality: "medium",
    costPer1k: 0.00015,
    description: "Fast & affordable",
  },
  {
    id: "o1-mini",
    name: "o1-mini",
    provider: "openai",
    quality: "high",
    costPer1k: 0.003,
    description: "Best for reasoning & logic",
  },
  {
    id: "o1",
    name: "o1",
    provider: "openai",
    quality: "high",
    costPer1k: 0.015,
    description: "Most powerful reasoning",
  },
];

// ─── Shared badge helpers ─────────────────────────────────────────────────────

const SPEED_BADGE: Record<ModelConfig["speed"], string> = {
  fast: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  slow: "bg-red-500/20 text-red-400",
};

const QUALITY_BADGE_ROUTER: Record<ModelConfig["quality"], string> = {
  high: "bg-green-500/20 text-green-400 border border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  economy: "bg-zinc-700/60 text-zinc-400 border border-zinc-600/30",
};

const QUALITY_LABEL: Record<ModelConfig["quality"], string> = {
  high: "⭐⭐⭐",
  medium: "⭐⭐",
  economy: "⭐",
};

const PROVIDER_BADGE: Record<string, string> = {
  openai: "bg-indigo-600/25 text-indigo-300 border border-indigo-500/30",
  anthropic: "bg-orange-600/25 text-orange-300 border border-orange-500/30",
  google: "bg-blue-600/25 text-blue-300 border border-blue-500/30",
};

function _formatCost(costPer1kTokens: number): string {
  return `$${costPer1kTokens.toFixed(5)}/1k`;
}

function _groupByProvider(
  models: Record<string, ModelConfig>
): Record<string, ModelConfig[]> {
  const groups: Record<string, ModelConfig[]> = {};
  for (const model of Object.values(models)) {
    if (!groups[model.provider]) groups[model.provider] = [];
    groups[model.provider].push(model);
  }
  return groups;
}

// ─── Task-based selector (used by app/ai/page.tsx) ────────────────────────────

interface TaskModelSelectorProps {
  task: TaskType;
  value: string;
  onChange: (modelId: string) => void;
  models?: never;
}

// ─── Standalone selector (used by new Builder page) ──────────────────────────

interface StandaloneModelSelectorProps {
  task?: never;
  value: string;
  onChange: (modelId: string) => void;
  models?: ModelOption[];
}

type ModelSelectorProps = TaskModelSelectorProps | StandaloneModelSelectorProps;

// ─── Standalone variant sub-component ────────────────────────────────────────

function StandaloneModelSelector({
  value,
  onChange,
  models = DEFAULT_MODELS,
}: {
  value: string;
  onChange: (modelId: string) => void;
  models: ModelOption[];
}) {
  const [open, setOpen] = useState(false);
  const selected = models.find((m) => m.id === value) ?? models[0];

  // ModelOption uses "fast"|"medium"|"high" while QUALITY_BADGE_ROUTER uses the router quality type.
  // Add "fast" mapping to the standalone badge map.
  const standaloneBadge: Record<string, string> = {
    ...QUALITY_BADGE_ROUTER,
    fast: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <span>{selected.name}</span>
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${standaloneBadge[selected.quality] ?? ""}`}>
            {selected.quality}
          </span>
        </span>
        <span className="text-zinc-500">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
        >
          {models.map((m) => (
            <li key={m.id} role="option" aria-selected={m.id === value}>
              <button
                onClick={() => { onChange(m.id); setOpen(false); }}
                className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-zinc-800 ${
                  m.id === value ? "bg-zinc-800" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100">{m.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${PROVIDER_BADGE[m.provider] ?? ""}`}>
                    {m.provider}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${standaloneBadge[m.quality] ?? ""}`}>
                    {m.quality}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500">
                    ${m.costPer1k.toFixed(5)}/1k
                  </span>
                </div>
                {m.description && (
                  <span className="text-xs text-zinc-500">{m.description}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Default export — unified component ──────────────────────────────────────

export default function ModelSelector(props: ModelSelectorProps) {
  // Standalone (no task) variant
  if (!props.task) {
    return (
      <StandaloneModelSelector
        value={props.value}
        onChange={props.onChange}
        models={props.models ?? DEFAULT_MODELS}
      />
    );
  }

  // Task-based variant (original implementation)
  const { task, value, onChange } = props;
  const taskModelIds = new Set(MODEL_ROUTING[task]);
  const taskModels = Object.fromEntries(
    Object.entries(SUPPORTED_MODELS).filter(([id]) => taskModelIds.has(id))
  ) as Record<string, ModelConfig>;
  const groups = _groupByProvider(taskModels);
  const selected: ModelConfig | undefined = SUPPORTED_MODELS[value];

  return (
    <div className="flex flex-col gap-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {Object.entries(groups).map(([provider, models]) => (
          <optgroup key={provider} label={provider.toUpperCase()}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.speed} · {_formatCost(m.costPer1kTokens)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {selected && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-xs text-zinc-300 dark:bg-zinc-800/50">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-zinc-100">{selected.name}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[selected.provider] ?? "bg-indigo-600/30 text-indigo-300"}`}>
              {selected.provider}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className={`rounded px-2 py-0.5 font-medium ${SPEED_BADGE[selected.speed]}`}>
              {selected.speed}
            </span>
            <span className={`rounded px-2 py-0.5 font-medium ${QUALITY_BADGE_ROUTER[selected.quality]}`}>
              {selected.quality} {QUALITY_LABEL[selected.quality]}
            </span>
            <span className="rounded bg-zinc-700/60 px-2 py-0.5 text-zinc-400">
              {_formatCost(selected.costPer1kTokens)} per 1k tokens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
