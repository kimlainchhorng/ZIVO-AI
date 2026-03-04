"use client";

import React, { useCallback, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepEvent {
  type: "step";
  step: string;
  status: "running" | "done" | "error";
  detail?: string;
}

interface FixEvent {
  type: "fix";
  iteration: number;
  files: Array<{ path: string; content: string; action: string }>;
}

interface CompleteEvent {
  type: "complete";
  files: Array<{ path: string; content: string }>;
  iterations: number;
  valid: boolean;
}

interface ErrorEvent {
  type: "error";
  message: string;
}

type SSEEvent = StepEvent | FixEvent | CompleteEvent | ErrorEvent;

interface BuildFixPanelProps {
  files: Record<string, string>;
  onFilesFixed: (files: Record<string, string>) => void;
}

// ─── Inline diff renderer ─────────────────────────────────────────────────────

interface DiffRendererProps {
  diffs: Record<string, string>;
  onAccept: () => void;
  onReject: () => void;
}

function DiffRenderer({ diffs, onAccept, onReject }: DiffRendererProps): React.JSX.Element {
  const entries = Object.entries(diffs);

  if (entries.length === 0) {
    return (
      <div className="text-zinc-400 text-sm text-center py-4">
        No diffs to display.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {entries.map(([filePath, diffText]) => {
        const lines = diffText.split("\n");
        const added = lines.filter(
          (l) => l.startsWith("+") && !l.startsWith("+++")
        ).length;
        const removed = lines.filter(
          (l) => l.startsWith("-") && !l.startsWith("---")
        ).length;

        return (
          <div
            key={filePath}
            className="rounded-lg border border-white/10 overflow-hidden"
            style={{ background: "#0f1120" }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 border-b border-white/10"
              style={{ background: "#0a0b14" }}
            >
              <span className="font-mono text-xs text-zinc-200 truncate max-w-xs">
                {filePath}
              </span>
              <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                <span className="text-green-400">+{added}</span>
                {" / "}
                <span className="text-red-400">-{removed}</span>
              </span>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table
                className="w-full text-xs font-mono border-collapse"
                style={{ fontSize: 11 }}
              >
                <tbody>
                  {lines.map((line, idx) => {
                    if (line.startsWith("@@")) {
                      return (
                        <tr key={idx}>
                          <td
                            colSpan={2}
                            className="px-2 py-px text-zinc-500"
                            style={{ background: "rgba(99,102,241,0.08)" }}
                          >
                            {line}
                          </td>
                        </tr>
                      );
                    }
                    if (
                      line.startsWith("+++") ||
                      line.startsWith("---") ||
                      line.startsWith("diff ")
                    ) {
                      return null;
                    }
                    if (line.startsWith("+")) {
                      return (
                        <tr
                          key={idx}
                          style={{ background: "rgba(16,185,129,0.12)" }}
                        >
                          <td className="px-2 py-px text-green-400 select-none w-4 text-center">
                            +
                          </td>
                          <td className="px-2 py-px text-green-300 whitespace-pre">
                            {line.slice(1)}
                          </td>
                        </tr>
                      );
                    }
                    if (line.startsWith("-")) {
                      return (
                        <tr
                          key={idx}
                          style={{ background: "rgba(239,68,68,0.12)" }}
                        >
                          <td className="px-2 py-px text-red-400 select-none w-4 text-center">
                            -
                          </td>
                          <td className="px-2 py-px text-red-300 whitespace-pre">
                            {line.slice(1)}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-px text-zinc-600 select-none w-4 text-center">
                          {" "}
                        </td>
                        <td className="px-2 py-px text-zinc-400 whitespace-pre">
                          {line.startsWith(" ") ? line.slice(1) : line}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="flex gap-3 pt-1">
        <button
          onClick={onAccept}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: "rgba(16,185,129,0.15)",
            border: "1px solid rgba(16,185,129,0.35)",
            color: "#10b981",
          }}
        >
          Accept All Changes
        </button>
        <button
          onClick={onReject}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// ─── Spinner icon ─────────────────────────────────────────────────────────────

function Spinner(): React.JSX.Element {
  return (
    <svg
      className="animate-spin"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="6"
        cy="6"
        r="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="20"
        strokeDashoffset="10"
        opacity="0.4"
      />
      <path
        d="M6 1a5 5 0 0 1 5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepItem({ event }: { event: StepEvent }): React.JSX.Element {
  const icon =
    event.status === "running" ? (
      <span className="text-yellow-400 flex items-center">
        <Spinner />
      </span>
    ) : event.status === "done" ? (
      <span className="text-green-400">✓</span>
    ) : (
      <span className="text-red-400">✕</span>
    );

  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 w-4 flex-shrink-0 flex justify-center">{icon}</span>
      <div className="min-w-0">
        <span
          className={
            event.status === "running"
              ? "text-yellow-300"
              : event.status === "done"
              ? "text-zinc-200"
              : "text-red-300"
          }
        >
          {event.step}
        </span>
        {event.detail && (
          <p className="text-xs text-zinc-500 mt-0.5 break-words">{event.detail}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BuildFixPanel({
  files,
  onFilesFixed,
}: BuildFixPanelProps): React.JSX.Element {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteEvent | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, string> | null>(null);
  const [pendingDiffs, setPendingDiffs] = useState<Record<string, string> | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleRun = useCallback(async (): Promise<void> => {
    setIsRunning(true);
    setSteps([]);
    setError(null);
    setResult(null);
    setPendingFiles(null);
    setPendingDiffs(null);
    setShowDiff(false);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/build-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(raw) as SSEEvent;
          } catch {
            continue;
          }

          if (event.type === "step") {
            setSteps((prev) => {
              // Replace last step if same text and was 'running'
              const last = prev[prev.length - 1];
              if (last && last.step === event.step && last.status === "running") {
                return [...prev.slice(0, -1), event];
              }
              return [...prev, event];
            });
          } else if (event.type === "fix") {
            // Collect diffs for changed files
            const fixEvent = event as FixEvent;
            const newDiffs: Record<string, string> = {};
            for (const f of fixEvent.files) {
              const oldContent = files[f.path] ?? "";
              if (oldContent !== f.content) {
                newDiffs[f.path] = `--- a/${f.path}\n+++ b/${f.path}\n` +
                  f.content
                    .split("\n")
                    .map((l) => `+${l}`)
                    .join("\n");
              }
            }
            setPendingDiffs((prev) => ({ ...(prev ?? {}), ...newDiffs }));
          } else if (event.type === "complete") {
            const completeEvent = event as CompleteEvent;
            setResult(completeEvent);
            // Build new file map from result
            const newMap: Record<string, string> = {};
            for (const f of completeEvent.files) {
              newMap[f.path] = f.content;
            }
            // Compute diffs between original and fixed files
            const diffs: Record<string, string> = {};
            for (const [path, newContent] of Object.entries(newMap)) {
              const oldContent = files[path] ?? "";
              if (oldContent !== newContent) {
                diffs[path] = `--- a/${path}\n+++ b/${path}\n` +
                  newContent
                    .split("\n")
                    .map((l) => `+${l}`)
                    .join("\n");
              }
            }
            setPendingFiles(newMap);
            if (Object.keys(diffs).length > 0) {
              setPendingDiffs(diffs);
              setShowDiff(true);
            }
          } else if (event.type === "error") {
            const errorEvent = event as ErrorEvent;
            setError(errorEvent.message);
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setIsRunning(false);
    }
  }, [files]);

  const handleAccept = useCallback((): void => {
    if (pendingFiles) {
      onFilesFixed(pendingFiles);
    }
    setShowDiff(false);
    setPendingFiles(null);
    setPendingDiffs(null);
  }, [pendingFiles, onFilesFixed]);

  const handleReject = useCallback((): void => {
    setShowDiff(false);
    setPendingFiles(null);
    setPendingDiffs(null);
  }, []);

  const hasChanges =
    pendingDiffs && Object.keys(pendingDiffs).length > 0 && showDiff;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "#0f1120",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ background: "#0a0b14" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm">Build Check</span>
          {result && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: result.valid
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(239,68,68,0.12)",
                color: result.valid ? "#10b981" : "#ef4444",
                border: `1px solid ${result.valid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"}`,
              }}
            >
              {result.valid
                ? `✅ Passed in ${result.iterations} iteration${result.iterations !== 1 ? "s" : ""}`
                : `⚠️ Could not fully fix after ${result.iterations} iteration${result.iterations !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: isRunning
              ? "rgba(99,102,241,0.1)"
              : "rgba(99,102,241,0.2)",
            border: "1px solid rgba(99,102,241,0.4)",
            color: "#a5b4fc",
          }}
        >
          {isRunning && <Spinner />}
          {isRunning ? "Running…" : "Run Build Check"}
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3">
        {/* Steps */}
        {steps.length > 0 && (
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <StepItem key={i} event={step} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-md px-3 py-2 text-sm text-red-300"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </div>
        )}

        {/* Empty state */}
        {!isRunning && steps.length === 0 && !error && (
          <p className="text-zinc-500 text-sm text-center py-2">
            Click &ldquo;Run Build Check&rdquo; to analyze and auto-fix your files.
          </p>
        )}

        {/* Diff viewer */}
        {hasChanges && pendingDiffs && (
          <div className="mt-1">
            <p className="text-xs text-zinc-400 mb-2">
              Review the changes before applying:
            </p>
            <DiffRenderer
              diffs={pendingDiffs}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </div>
        )}

        {/* No changes message */}
        {result && !hasChanges && !error && (
          <p className="text-xs text-zinc-500 text-center">
            {result.valid
              ? "No changes were needed."
              : "No fixable changes were produced."}
          </p>
        )}
      </div>
    </div>
  );
}
