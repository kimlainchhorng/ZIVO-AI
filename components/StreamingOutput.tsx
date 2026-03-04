"use client";

import { useEffect, useRef, useState } from "react";

interface StreamingOutputProps {
  stream: ReadableStream<string> | null;
  onComplete?: (fullText: string) => void;
  className?: string;
}

type StreamStatus = "idle" | "streaming" | "done" | "error";

export default function StreamingOutput({
  stream,
  onComplete,
  className = "",
}: StreamingOutputProps) {
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLPreElement>(null);
  const fullTextRef = useRef("");
  const prevStreamRef = useRef<ReadableStream<string> | null>(null);

  useEffect(() => {
    // Only start a new stream read if the stream reference changed
    if (stream === prevStreamRef.current) return;
    prevStreamRef.current = stream;

    if (!stream) {
      return;
    }

    let cancelled = false;
    fullTextRef.current = "";

    // Use a microtask so React batches the state initialization
    const startStream = async () => {
      setOutput("");
      setStatus("streaming");
      setError(null);

      try {
        const reader = stream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          if (value) {
            fullTextRef.current += value;
            setOutput((prev) => prev + value);
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }
        }
        if (!cancelled) {
          setStatus("done");
          onComplete?.(fullTextRef.current);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Stream error");
          setStatus("error");
        }
      }
    };

    void startStream();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTextRef.current).catch(() => {});
  };

  const isStreaming = status === "streaming";
  const isDone = status === "done";

  return (
    <div
      className={`relative rounded-xl border border-white/10 bg-[#0d0e1a] overflow-hidden ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isStreaming && (
            <>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
              <span className="text-xs text-indigo-300 font-medium">Generating…</span>
            </>
          )}
          {isDone && (
            <>
              <span className="text-green-400 text-sm">✓</span>
              <span className="text-xs text-green-300 font-medium">Done</span>
            </>
          )}
          {status === "error" && (
            <>
              <span className="text-red-400 text-sm">✗</span>
              <span className="text-xs text-red-300 font-medium">Error</span>
            </>
          )}
          {status === "idle" && (
            <span className="text-xs text-white/40">Ready</span>
          )}
        </div>
        {(isDone || output.length > 0) && (
          <button
            onClick={handleCopy}
            className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            Copy
          </button>
        )}
      </div>

      {/* Output area */}
      <pre
        ref={containerRef}
        className="overflow-auto p-4 text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[600px] min-h-[120px]"
      >
        {output}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse align-text-bottom" />
        )}
        {status === "error" && (
          <span className="text-red-400 block mt-2">Error: {error}</span>
        )}
        {!output && status === "idle" && (
          <span className="text-white/25 italic">Waiting for stream…</span>
        )}
      </pre>
    </div>
  );
}
