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
    const raw = localStorage.getItem('connectorState');
    return raw ? (JSON.parse(raw) as ConnectorState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

const ConnectorComponent = () => {
  // Use lazy initializer to load from localStorage without triggering a cascading render
  const [connState, setConnState] = useState<ConnectorState>(loadConnectorState);

  // Rest of the component
  return null;
};

export default ConnectorComponent;