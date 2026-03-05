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

const QUALITY_BADGE: Record<ModelConfig["quality"], string> = {
  high: "bg-green-500/20 text-green-400 border border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  economy: "bg-zinc-700/60 text-zinc-400 border border-zinc-600/30",
};

const PROVIDER_BADGE: Record<string, string> = {
  openai: "bg-indigo-600/25 text-indigo-300 border border-indigo-500/30",
  anthropic: "bg-orange-600/25 text-orange-300 border border-orange-500/30",
  google: "bg-blue-600/25 text-blue-300 border border-blue-500/30",
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
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-zinc-100">{selected.name}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${PROVIDER_BADGE[selected.provider] ?? "bg-indigo-600/30 text-indigo-300"}`}>
              {selected.provider}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded px-2 py-0.5 font-medium ${SPEED_BADGE[selected.speed]}`}
            >
              {selected.speed}
            </span>
            <span className={`rounded px-2 py-0.5 font-medium ${QUALITY_BADGE[selected.quality]}`}>
              {selected.quality} {QUALITY_LABEL[selected.quality]}
            </span>
            <span className="rounded bg-zinc-700/60 px-2 py-0.5 text-zinc-400">
              {formatCost(selected.costPer1kTokens)} per 1k tokens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
