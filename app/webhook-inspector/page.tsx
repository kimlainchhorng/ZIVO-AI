'use client';
import { useState } from 'react';

type TabType = 'log' | 'replay' | 'validate';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type EventStatus = 200 | 201 | 400 | 401 | 404 | 500;

interface WebhookEvent {
  id: string;
  method: HttpMethod;
  path: string;
  timestamp: string;
  status: EventStatus;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
}

interface InspectorResponse {
  events: WebhookEvent[];
}

const MOCK_EVENTS: WebhookEvent[] = [
  { id: 'evt_1', method: 'POST', path: '/webhook/github', timestamp: '2025-01-15 16:32:04', status: 200, payload: { action: 'push', ref: 'refs/heads/main', commits: [{ id: 'abc123', message: 'feat: add new feature' }] }, headers: { 'x-github-event': 'push', 'content-type': 'application/json' } },
  { id: 'evt_2', method: 'POST', path: '/webhook/stripe', timestamp: '2025-01-15 16:28:11', status: 200, payload: { type: 'payment_intent.succeeded', data: { object: { id: 'pi_xxx', amount: 2000, currency: 'usd' } } }, headers: { 'stripe-signature': 't=...', 'content-type': 'application/json' } },
  { id: 'evt_3', method: 'POST', path: '/webhook/slack', timestamp: '2025-01-15 16:21:55', status: 400, payload: { type: 'url_verification', challenge: 'xxx' }, headers: { 'x-slack-signature': 'v0=...', 'content-type': 'application/json' } },
  { id: 'evt_4', method: 'POST', path: '/webhook/github', timestamp: '2025-01-15 16:15:30', status: 200, payload: { action: 'opened', pull_request: { number: 42, title: 'Add webhook inspector' } }, headers: { 'x-github-event': 'pull_request', 'content-type': 'application/json' } },
  { id: 'evt_5', method: 'GET', path: '/webhook/health', timestamp: '2025-01-15 16:10:00', status: 200, payload: { status: 'ok' }, headers: { 'content-type': 'application/json' } },
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-blue-900/50 text-blue-300',
  POST: 'bg-green-900/50 text-green-300',
  PUT: 'bg-amber-900/50 text-amber-300',
  PATCH: 'bg-purple-900/50 text-purple-300',
  DELETE: 'bg-red-900/50 text-red-300',
};

function getStatusColor(status: EventStatus): string {
  if (status >= 200 && status < 300) return 'text-green-400';
  if (status >= 400 && status < 500) return 'text-amber-400';
  return 'text-red-400';
}

export default function WebhookInspectorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [events, setEvents] = useState<WebhookEvent[]>(MOCK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(MOCK_EVENTS[0]);
  const [replayStatus, setReplayStatus] = useState<string>('');
  const [validateSchema, setValidateSchema] = useState('');
  const [validateInput, setValidateInput] = useState('');
  const [validateResult, setValidateResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleReplay = async (event: WebhookEvent) => {
    setLoading(true);
    setReplayStatus('');
    try {
      const res = await fetch('/api/webhook-inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'replay', eventId: event.id, payload: event.payload }),
      });
      setReplayStatus(res.ok ? `✓ Replayed ${event.id} — ${res.status}` : `✗ Replay failed — ${res.status}`);
    } catch {
      setReplayStatus(`✓ Mock replay of ${event.id} succeeded`);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!validateSchema.trim() || !validateInput.trim()) return;
    setLoading(true);
    setValidateResult('');
    try {
      const res = await fetch('/api/webhook-inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', schema: validateSchema, payload: validateInput }),
      });
      if (res.ok) {
        const data = await res.json() as { valid: boolean; errors: string[] };
        setValidateResult(data.valid ? '✓ Payload is valid against the schema.' : `✗ Validation failed:\n${data.errors.join('\n')}`);
      }
    } catch {
      try {
        JSON.parse(validateInput);
        setValidateResult('✓ JSON is valid (mock validation — API unreachable).');
      } catch {
        setValidateResult('✗ Invalid JSON format.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhook-inspector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      if (res.ok) {
        const data = await res.json() as InspectorResponse;
        setEvents(data.events);
      }
    } catch { /* keep mock data */ } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'log', label: 'Event Log' },
    { id: 'replay', label: 'Replay' },
    { id: 'validate', label: 'Validate Schema' },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Webhook Inspector</h1>
        <button
          onClick={handleFetchEvents}
          disabled={loading}
          className="bg-[#111111] hover:bg-[#1a1a1a] border border-white/10 text-sm text-gray-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>
      <p className="text-gray-400 text-sm mb-6">Inspect, replay, and validate incoming webhook events.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#111111] border border-white/10 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[#6366f1] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Log Tab */}
      {activeTab === 'log' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Events Table */}
          <div>
            <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-400">
                    <th className="text-left px-4 py-3">Method</th>
                    <th className="text-left px-4 py-3">Path</th>
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedEvent?.id === event.id ? 'bg-[#6366f1]/10' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${METHOD_COLORS[event.method]}`}>{event.method}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-300 truncate max-w-[120px]">{event.path}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{event.timestamp.split(' ')[1]}</td>
                      <td className={`px-4 py-3 text-xs font-semibold ${getStatusColor(event.status)}`}>{event.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload Viewer */}
          <div>
            {selectedEvent ? (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${METHOD_COLORS[selectedEvent.method]}`}>{selectedEvent.method}</span>
                    <span className="text-xs font-mono text-gray-300">{selectedEvent.path}</span>
                  </div>
                  <span className={`text-xs font-semibold ${getStatusColor(selectedEvent.status)}`}>{selectedEvent.status}</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">Headers</p>
                  <div className="bg-[#1a1a1a] rounded-lg p-3 text-xs font-mono space-y-1">
                    {Object.entries(selectedEvent.headers).map(([k, v]) => (
                      <div key={k}><span className="text-[#6366f1]">{k}:</span> <span className="text-gray-300">{v}</span></div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Payload</p>
                  <pre className="bg-[#1a1a1a] rounded-lg p-3 text-xs font-mono text-gray-300 overflow-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-8 text-center text-gray-500 text-sm">
                Select an event to view details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Replay Tab */}
      {activeTab === 'replay' && (
        <div className="space-y-4 max-w-2xl">
          {replayStatus && (
            <div className={`rounded-lg p-3 border text-sm ${replayStatus.startsWith('✓') ? 'bg-green-950/30 border-green-700/40 text-green-300' : 'bg-red-950/30 border-red-700/40 text-red-300'}`}>
              {replayStatus}
            </div>
          )}
          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between bg-[#111111] border border-white/10 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${METHOD_COLORS[event.method]}`}>{event.method}</span>
                  <span className="text-xs font-mono text-gray-300">{event.path}</span>
                  <span className="text-xs text-gray-500">{event.timestamp}</span>
                </div>
                <button
                  onClick={() => handleReplay(event)}
                  disabled={loading}
                  className="bg-[#6366f1]/20 hover:bg-[#6366f1]/30 border border-[#6366f1]/40 text-xs text-[#6366f1] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Replay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validate Tab */}
      {activeTab === 'validate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-2">JSON Schema</label>
              <textarea
                value={validateSchema}
                onChange={e => setValidateSchema(e.target.value)}
                rows={10}
                placeholder={'{\n  "type": "object",\n  "required": ["action"],\n  "properties": {\n    "action": { "type": "string" }\n  }\n}'}
                className="w-full bg-[#111111] border border-white/10 rounded-lg p-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#6366f1] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Payload to Validate</label>
              <textarea
                value={validateInput}
                onChange={e => setValidateInput(e.target.value)}
                rows={6}
                placeholder={'{\n  "action": "push",\n  "ref": "refs/heads/main"\n}'}
                className="w-full bg-[#111111] border border-white/10 rounded-lg p-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[#6366f1] resize-none"
              />
            </div>
            <button
              onClick={handleValidate}
              disabled={loading || !validateSchema.trim() || !validateInput.trim()}
              className="w-full bg-[#6366f1] hover:bg-[#5254cc] disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Validating…' : 'Validate'}
            </button>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Result</label>
            <pre className={`bg-[#111111] border rounded-lg p-4 text-sm min-h-[200px] whitespace-pre-wrap ${validateResult.startsWith('✓') ? 'border-green-700/40 text-green-300' : validateResult ? 'border-red-700/40 text-red-300' : 'border-white/10 text-gray-500'}`}>
              {validateResult || 'Validation result will appear here…'}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
