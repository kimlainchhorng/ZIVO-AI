'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BuildTask = 'code' | 'website' | 'mobile' | '3d' | 'image' | 'video';

export interface ModelOption {
  id: string;
  label: string;
  provider: 'openai' | 'anthropic' | 'google';
  tier: 'fast' | 'medium' | 'powerful';
  pricePerK: string;
}

const MODELS: ModelOption[] = [
  { id: 'gpt-4o',       label: 'GPT-4o',       provider: 'openai', tier: 'medium',   pricePerK: '$0.00500' },
  { id: 'gpt-4o-mini',  label: 'GPT-4o mini',  provider: 'openai', tier: 'fast',     pricePerK: '$0.00015' },
  { id: 'gpt-4.1',      label: 'GPT-4.1',      provider: 'openai', tier: 'powerful', pricePerK: '$0.00800' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', provider: 'openai', tier: 'fast',     pricePerK: '$0.00040' },
  { id: 'o4-mini',      label: 'o4-mini',       provider: 'openai', tier: 'powerful', pricePerK: '$0.01100' },
];

interface ModelSelectorProps {
  task?: BuildTask | string;
  value?: string;
  onChange?: (modelId: string) => void;
  className?: string;
}

const TIER_COLORS: Record<ModelOption['tier'], string> = {
  fast:     'text-emerald-400',
  medium:   'text-amber-400',
  powerful: 'text-violet-400',
};

export function ModelSelector({ value, onChange, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-indigo-500"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="font-semibold">{selected.label}</span>
          <span className={cn('text-[10px]', TIER_COLORS[selected.tier])}>{selected.tier}</span>
        </span>
        <span className="text-slate-500 text-[10px]">{selected.pricePerK}/1k</span>
        <ChevronDown className={cn('h-3 w-3 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#0f1120] py-1 shadow-xl"
        >
          {MODELS.map((model) => (
            <li
              key={model.id}
              role="option"
              aria-selected={model.id === selected.id}
              onClick={() => { onChange?.(model.id); setOpen(false); }}
              className={cn(
                'flex cursor-pointer items-center justify-between px-3 py-2 text-xs transition-colors',
                model.id === selected.id
                  ? 'bg-indigo-500/15 text-slate-100'
                  : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-medium">{model.label}</span>
                <span className={cn('text-[10px]', TIER_COLORS[model.tier])}>{model.tier}</span>
              </span>
              <span className="text-slate-500">{model.pricePerK}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ModelSelector;
