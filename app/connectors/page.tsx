"use client";

import { useState } from 'react';

interface ConnectorState {
  githubConnected: boolean;
  modalToken: string;
  modalRepo: string;
  supabaseConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const DEFAULT_STATE: ConnectorState = {
  githubConnected: false,
  modalToken: '',
  modalRepo: '',
  supabaseConnected: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
};

function loadConnectorState(): ConnectorState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem('connectorState');
    if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
  } catch (err) {
    console.error('[connectors] Failed to load state from localStorage:', err);
  }
  return DEFAULT_STATE;
}

function saveConnectorState(state: ConnectorState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('connectorState', JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

const ConnectorComponent = () => {
  // Use lazy initializer to load from localStorage without triggering a cascading render
  const [connState, setConnState] = useState<ConnectorState>(loadConnectorState);

  function updateState(partial: Partial<ConnectorState>) {
    setConnState((prev) => {
      const next = { ...prev, ...partial };
      saveConnectorState(next);
      return next;
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Connectors</h1>

      {/* GitHub Connector */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">GitHub</h2>
          <span className={`px-2 py-1 rounded text-sm ${connState.githubConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {connState.githubConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {!connState.githubConnected ? (
          <div className="space-y-2">
            <input
              type="password"
              placeholder="GitHub Personal Access Token"
              value={connState.modalToken}
              onChange={(e) => updateState({ modalToken: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Repository (owner/repo)"
              value={connState.modalRepo}
              onChange={(e) => updateState({ modalRepo: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (connState.modalToken) updateState({ githubConnected: true });
              }}
              className="bg-gray-900 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
            >
              Connect GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-600">
            <p>Repo: <span className="font-medium text-gray-900">{connState.modalRepo || '(none)'}</span></p>
            <button
              onClick={() => updateState({ githubConnected: false, modalToken: '', modalRepo: '' })}
              className="text-red-600 hover:underline text-xs"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Supabase Connector */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Supabase</h2>
          <span className={`px-2 py-1 rounded text-sm ${connState.supabaseConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {connState.supabaseConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {!connState.supabaseConnected ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Supabase Project URL"
              value={connState.supabaseUrl}
              onChange={(e) => updateState({ supabaseUrl: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="Supabase Anon Key"
              value={connState.supabaseAnonKey}
              onChange={(e) => updateState({ supabaseAnonKey: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (connState.supabaseUrl && connState.supabaseAnonKey) {
                  updateState({ supabaseConnected: true });
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-500"
            >
              Connect Supabase
            </button>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-600">
            <p>URL: <span className="font-medium text-gray-900">{connState.supabaseUrl}</span></p>
            <button
              onClick={() => updateState({ supabaseConnected: false, supabaseUrl: '', supabaseAnonKey: '' })}
              className="text-red-600 hover:underline text-xs"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectorComponent;