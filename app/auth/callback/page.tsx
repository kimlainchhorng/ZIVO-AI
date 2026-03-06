'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      window.location.href = '/auth?error=missing_config';
      return;
    }

    const supabase = createClient(url, key);

    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (token) {
        localStorage.setItem('zivo_supabase_token', token);
      }
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') ?? '/ai';
      // Only redirect to relative paths to prevent open redirect attacks
      const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/ai';
      window.location.href = safeNext;
    }).catch(() => {
      window.location.href = '/auth';
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0b14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      color: '#f1f5f9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ width: '20px', height: '20px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Signing you in…
      </div>
    </div>
  );
}
