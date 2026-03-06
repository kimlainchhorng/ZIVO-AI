"use client";

import { useState, useEffect } from "react";
import type { ProjectMemory } from "@/lib/memory/project-memory";

interface MemoryPanelProps {
  projectId: string;
}

export default function MemoryPanel({ projectId }: MemoryPanelProps) {
  const [memory, setMemory] = useState<ProjectMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/memory?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data: ProjectMemory) => setMemory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleClear = async () => {
    if (!confirm("Clear all memory for this project?")) return;
    await fetch(
      `/api/memory?projectId=${encodeURIComponent(projectId)}`,
      { method: "DELETE" }
    );
    setMemory(null);
  };

  const handleSave = async (updates: Partial<ProjectMemory>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, updates }),
      });
      const data = await res.json() as ProjectMemory;
      setMemory(data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500 animate-pulse">
        Loading memory…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          🧬 AI Memory
        </h3>
        <button
          onClick={handleClear}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Clear
        </button>
      </div>

      {memory ? (
        <>
          <Section title="Tech Stack">
            <KV label="Framework" value={memory.techStack?.framework} />
            <KV label="Styling" value={memory.techStack?.styling} />
            <KV label="Database" value={memory.techStack?.database} />
            <KV label="Auth" value={memory.techStack?.auth} />
          </Section>

          <Section title="Coding Style">
            <KV
              label="Component Style"
              value={memory.codingStyle?.componentStyle}
            />
            <KV
              label="Semicolons"
              value={memory.codingStyle?.semicolons ? "Yes" : "No"}
            />
            <KV
              label="Quotes"
              value={memory.codingStyle?.quotes}
            />
          </Section>

          <Section title="Design Preferences">
            <KV
              label="Dark Mode"
              value={memory.designPreferences?.darkMode ? "Yes" : "No"}
            />
            {memory.designPreferences?.colorPalette?.length ? (
              <div className="flex gap-1 flex-wrap mt-1">
                {memory.designPreferences.colorPalette.map((c) => (
                  <span
                    key={c}
                    className="inline-block w-5 h-5 rounded border border-gray-300"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            ) : null}
          </Section>

          <Section title="Past Generations">
            {memory.pastGenerations.length === 0 ? (
              <p className="text-xs text-gray-400">None yet</p>
            ) : (
              memory.pastGenerations.slice(-5).map((g) => (
                <div key={g.id} className="text-xs text-gray-600 truncate">
                  {g.prompt}
                </div>
              ))
            )}
          </Section>

          <button
            disabled={saving}
            onClick={() =>
              handleSave({ designPreferences: { darkMode: !memory.designPreferences?.darkMode } })
            }
            className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Toggle Dark Mode Preference"}
          </button>
        </>
      ) : (
        <p className="text-xs text-gray-400">No memory stored yet.</p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-700">
      <span className="text-gray-400">{label}:</span>
      <span>{value}</span>
    </div>
  );
}
