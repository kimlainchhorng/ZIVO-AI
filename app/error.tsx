'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[ZIVO] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#0a0b14] text-slate-100">
      <div className="text-5xl" aria-hidden="true">⚠️</div>
      <div className="text-center">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-slate-500">Error ID: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default" size="md">
          Try Again
        </Button>
        <Button onClick={() => (window.location.href = '/')} variant="outline" size="md">
          Go Home
        </Button>
      </div>
    </div>
  );
}
