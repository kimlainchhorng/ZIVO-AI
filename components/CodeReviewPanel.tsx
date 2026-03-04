"use client";

import { useState } from "react";

interface CodeReviewPanelProps {
  code: string;
  language?: string;
  framework?: string;
}

type Severity = "error" | "warning" | "info";

interface ReviewIssue {
  severity: Severity;
  category: string;
  message: string;
  suggestion?: string;
}

interface ReviewResponse {
  score: number;
  issues: ReviewIssue[];
  recommendations: string[];
  summary?: string;
}

interface RefactorResponse {
  refactoredCode: string;
  explanation?: string;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
};

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-lg font-bold">{score}</span>
    </div>
  );
}

function IssueRow({ issue }: { issue: ReviewIssue }) {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-1.5">
      <div className="flex items-start gap-2 flex-wrap">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[issue.severity]}`}>
          {issue.severity}
        </span>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {issue.category}
        </span>
      </div>
      <p className="text-sm text-zinc-800 dark:text-zinc-200">{issue.message}</p>
      {issue.suggestion && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {expanded ? "▾ Hide suggestion" : "▸ Show suggestion"}
          </button>
          {expanded && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 rounded-md p-2">
              {issue.suggestion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CodeReviewPanel({ code, language, framework }: CodeReviewPanelProps) {
  const [reviewing, setReviewing] = useState<boolean>(false);
  const [refactoring, setRefactoring] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<ReviewResponse | null>(null);
  const [refactorResult, setRefactorResult] = useState<RefactorResponse | null>(null);
  const [reviewError, setReviewError] = useState<string>("");
  const [refactorError, setRefactorError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  async function handleReview() {
    setReviewing(true);
    setReviewError("");
    setReviewResult(null);
    try {
      const res = await fetch("/api/code-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, framework }),
      });
      const data: ReviewResponse = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Review failed");
      setReviewResult(data);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setReviewing(false);
    }
  }

  async function handleRefactor() {
    setRefactoring(true);
    setRefactorError("");
    setRefactorResult(null);
    try {
      const res = await fetch("/api/refactor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, framework }),
      });
      const data: RefactorResponse = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Refactor failed");
      setRefactorResult(data);
    } catch (err) {
      setRefactorError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefactoring(false);
    }
  }

  async function copyRefactored() {
    if (!refactorResult?.refactoredCode) return;
    await navigator.clipboard.writeText(refactorResult.refactoredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">AI Code Review</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReview}
            disabled={reviewing || !code}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {reviewing ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyzing code…
              </span>
            ) : (
              "Run Code Review"
            )}
          </button>
          <button
            onClick={handleRefactor}
            disabled={refactoring || !code}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            {refactoring ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Refactoring...
              </span>
            ) : (
              "Refactor"
            )}
          </button>
        </div>
      </div>

      {/* Review errors */}
      {reviewError && <p className="text-xs text-red-500">❌ {reviewError}</p>}

      {/* Review Results */}
      {reviewResult && (
        <div className="space-y-4">
          {/* Score + summary */}
          <div className="flex items-center gap-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 p-4">
            <ScoreCircle score={reviewResult.score} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Overall Score</p>
              {reviewResult.summary && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{reviewResult.summary}</p>
              )}
            </div>
          </div>

          {/* Issues */}
          {reviewResult.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Issues ({reviewResult.issues.length})
              </p>
              {reviewResult.issues.map((issue, i) => (
                <IssueRow key={i} issue={issue} />
              ))}
            </div>
          )}

          {/* Recommendations */}
          {reviewResult.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Recommendations
              </p>
              <ul className="list-disc list-inside space-y-1">
                {reviewResult.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Refactor errors */}
      {refactorError && <p className="text-xs text-red-500">❌ {refactorError}</p>}

      {/* Refactored Code */}
      {refactorResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Refactored Code
            </p>
            <button
              onClick={copyRefactored}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          {refactorResult.explanation && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">{refactorResult.explanation}</p>
          )}
          <pre className="rounded-lg bg-zinc-900 dark:bg-zinc-950 text-zinc-100 text-xs p-4 overflow-x-auto whitespace-pre-wrap">
            {refactorResult.refactoredCode}
          </pre>
        </div>
      )}
    </div>
  );
}
