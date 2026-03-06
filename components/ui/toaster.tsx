'use client';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(15,15,26,0.95)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#f1f5f9',
        },
      }}
    />
  );
}
