"use client";

import { SUPPORTED_MODELS, MODEL_ROUTING, type ModelConfig, type TaskType } from "@/lib/ai/model-router";

interface ModelSelectorProps {
  task: TaskType;
  value: string;
  onChange: (modelId: string) => void;
}

const SPEED_BADGE: Record<ModelConfig["speed"], string> = {
  fast: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  slow: "bg-red-500/20 text-red-400",
};

const QUALITY_LABEL: Record<ModelConfig["quality"], string> = {
  high: "⭐⭐⭐",
  medium: "⭐⭐",
  economy: "⭐",
};

function formatCost(costPer1kTokens: number): string {
  return `$${costPer1kTokens.toFixed(5)}/1k`;
}

// Group models by provider for the <optgroup> elements.
function groupByProvider(
  models: Record<string, ModelConfig>
): Record<string, ModelConfig[]> {
  const groups: Record<string, ModelConfig[]> = {};
  for (const model of Object.values(models)) {
    if (!groups[model.provider]) groups[model.provider] = [];
    groups[model.provider].push(model);
  }
  return groups;
}

export default function ModelSelector({ task, value, onChange }: ModelSelectorProps) {
  // Only surface models that are valid for the requested task type.
  const taskModelIds = new Set(MODEL_ROUTING[task]);
  const taskModels = Object.fromEntries(
    Object.entries(SUPPORTED_MODELS).filter(([id]) => taskModelIds.has(id))
  ) as Record<string, ModelConfig>;
  const groups = groupByProvider(taskModels);
  const selected: ModelConfig | undefined = SUPPORTED_MODELS[value];

  return (
    <div className="flex flex-col gap-3">
      {/* Dropdown */}
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
                {m.name} · {m.speed} · {formatCost(m.costPer1kTokens)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Info card for selected model */}
      {selected && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-xs text-zinc-300 dark:bg-zinc-800/50">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-zinc-100">{selected.name}</span>
            <span className="rounded bg-indigo-600/30 px-2 py-0.5 text-indigo-300">
              {selected.provider}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded px-2 py-0.5 font-medium ${SPEED_BADGE[selected.speed]}`}
            >
              {selected.speed}
            </span>
            <span className="rounded bg-zinc-700/60 px-2 py-0.5">
              quality {QUALITY_LABEL[selected.quality]}
            </span>
            <span className="rounded bg-zinc-700/60 px-2 py-0.5">
              {formatCost(selected.costPer1kTokens)} per 1k tokens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
