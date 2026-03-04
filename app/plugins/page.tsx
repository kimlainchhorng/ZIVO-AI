'use client';
import NavBar from '../components/NavBar';
import { useState } from 'react';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

type TabKey = 'Installed' | 'Marketplace' | 'SDK Docs';

interface Plugin {
  id: string;
  icon: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  settingsFields: { label: string; placeholder: string; value: string }[];
}

interface MarketplacePlugin {
  name: string;
  icon: string;
  desc: string;
  installed: boolean;
}

const INITIAL_INSTALLED: Plugin[] = [
  {
    id: 'formatter', icon: '🎨', name: 'Code Formatter', version: 'v2.1.0', enabled: true,
    description: 'Auto-format code on save with Prettier & ESLint',
    settingsFields: [{ label: 'Tab size', placeholder: '2', value: '2' }, { label: 'Print width', placeholder: '80', value: '80' }],
  },
  {
    id: 'git', icon: '🔀', name: 'Git Integration', version: 'v1.4.2', enabled: true,
    description: 'Inline blame, diff viewer, and branch management',
    settingsFields: [{ label: 'Remote URL', placeholder: 'https://github.com/…', value: '' }],
  },
  {
    id: 'slack', icon: '💬', name: 'Slack Notifier', version: 'v3.0.1', enabled: false,
    description: 'Post deployment and alert notifications to Slack',
    settingsFields: [{ label: 'Webhook URL', placeholder: 'https://hooks.slack.com/…', value: '' }, { label: 'Channel', placeholder: '#deployments', value: '#deployments' }],
  },
  {
    id: 'analytics', icon: '📊', name: 'Analytics Pro', version: 'v1.2.0', enabled: true,
    description: 'Advanced usage analytics and performance metrics',
    settingsFields: [{ label: 'Tracking ID', placeholder: 'UA-XXXXX-Y', value: '' }],
  },
];

const INITIAL_MARKETPLACE: MarketplacePlugin[] = [
  { name: 'Figma Sync',      icon: '🖼',  desc: 'Import designs directly from Figma',         installed: false },
  { name: 'GitHub Actions',  icon: '⚙️', desc: 'Trigger and monitor CI/CD workflows',         installed: false },
  { name: 'Stripe Billing',  icon: '💳',  desc: 'Manage subscriptions and payments',           installed: false },
  { name: 'SendGrid Email',  icon: '📧',  desc: 'Transactional email via SendGrid API',        installed: false },
  { name: 'AWS Deploy',      icon: '☁️', desc: 'One-click deploy to AWS services',            installed: false },
  { name: 'Datadog Monitor', icon: '🐶',  desc: 'Infrastructure monitoring and alerting',      installed: false },
];

export default function PluginsPage() {
  const [tab, setTab] = useState<TabKey>('Installed');
  const [plugins, setPlugins] = useState<Plugin[]>(INITIAL_INSTALLED);
  const [marketplace, setMarketplace] = useState<MarketplacePlugin[]>(INITIAL_MARKETPLACE);
  const [openSettings, setOpenSettings] = useState<string | null>(null);
  const [settingValues, setSettingValues] = useState<Record<string, Record<number, string>>>({});

  function togglePlugin(id: string) {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  }

  function toggleSettings(id: string) {
    setOpenSettings(prev => prev === id ? null : id);
  }

  function installPlugin(name: string) {
    setMarketplace(prev => prev.map(p => p.name === name ? { ...p, installed: true } : p));
  }

  function updateSettingValue(pluginId: string, idx: number, val: string) {
    setSettingValues(prev => ({
      ...prev,
      [pluginId]: { ...prev[pluginId], [idx]: val },
    }));
  }

  const TABS: TabKey[] = ['Installed', 'Marketplace', 'SDK Docs'];

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Plugins</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Extend ZIVO with powerful integrations and plugins</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}` }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer', color: tab === t ? COLORS.accent : COLORS.textSecondary, borderBottom: tab === t ? `2px solid ${COLORS.accent}` : '2px solid transparent', fontWeight: tab === t ? 600 : 400, fontSize: 14, marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>

        {/* INSTALLED TAB */}
        {tab === 'Installed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.3s ease' }}>
            {plugins.map(plugin => (
              <div key={plugin.id}>
                <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ fontSize: 28, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bgCard, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>{plugin.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{plugin.name}</span>
                        <span style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.bgCard, borderRadius: 4, padding: '1px 6px' }}>{plugin.version}</span>
                      </div>
                      <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 0 }}>{plugin.description}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <button onClick={() => toggleSettings(plugin.id)} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textSecondary, padding: '6px 13px', cursor: 'pointer', fontSize: 12 }}>Settings</button>
                      {/* Toggle */}
                      <div onClick={() => togglePlugin(plugin.id)} style={{ width: 44, height: 24, borderRadius: 999, background: plugin.enabled ? COLORS.accent : COLORS.bgCard, border: `1px solid ${plugin.enabled ? COLORS.accent : COLORS.border}`, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: plugin.enabled ? 22 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                  </div>

                  {openSettings === plugin.id && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 }}>Plugin Settings</div>
                      {plugin.settingsFields.map((field, idx) => (
                        <div key={idx}>
                          <label style={{ fontSize: 12, color: COLORS.textMuted, display: 'block', marginBottom: 4 }}>{field.label}</label>
                          <input
                            value={settingValues[plugin.id]?.[idx] ?? field.value}
                            onChange={e => updateSettingValue(plugin.id, idx, e.target.value)}
                            placeholder={field.placeholder}
                            style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 7, color: COLORS.textPrimary, padding: '7px 11px', fontSize: 13, width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <button onClick={() => { window.alert(`${plugin.name} settings saved.`); setOpenSettings(null); }} style={{ alignSelf: 'flex-start', background: COLORS.accentGradient, border: 'none', borderRadius: 7, color: '#fff', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MARKETPLACE TAB */}
        {tab === 'Marketplace' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14, animation: 'fadeIn 0.3s ease' }}>
            {marketplace.map((mp, i) => (
              <div key={i} style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.bgCard, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>{mp.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{mp.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{mp.desc}</div>
                  </div>
                </div>
                <button
                  onClick={() => !mp.installed && installPlugin(mp.name)}
                  disabled={mp.installed}
                  style={{ background: mp.installed ? 'rgba(34,197,94,0.12)' : COLORS.accentGradient, border: mp.installed ? `1px solid ${COLORS.success}` : 'none', borderRadius: 8, color: mp.installed ? COLORS.success : '#fff', padding: '8px 0', fontWeight: 600, cursor: mp.installed ? 'default' : 'pointer', fontSize: 13 }}
                >
                  {mp.installed ? 'Installed ✓' : 'Install'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* SDK DOCS TAB */}
        {tab === 'SDK Docs' && (
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 28, animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Plugin SDK Documentation</h2>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: COLORS.accent }}>Getting Started</h3>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: 16 }}>
              The ZIVO Plugin SDK lets you build and publish custom plugins. Install the SDK package to get started.
            </p>
            <pre style={{ background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, fontSize: 12, color: COLORS.textPrimary, marginBottom: 24 }}>npm install @zivo/plugin-sdk</pre>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: COLORS.accent }}>Plugin Manifest</h3>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>
              Every plugin requires a <code style={{ background: COLORS.bgCard, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>plugin.json</code> manifest file.
            </p>
            <pre style={{ background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, fontSize: 12, color: COLORS.textPrimary, marginBottom: 24 }}>{`{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "entry": "./dist/index.js",
  "permissions": ["storage", "network"]
}`}</pre>

            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: COLORS.accent }}>Plugin API</h3>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: 12 }}>
              Use the <code style={{ background: COLORS.bgCard, padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>PluginContext</code> object to access platform APIs.
            </p>
            <pre style={{ background: '#0d0e1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, fontSize: 12, color: COLORS.textPrimary }}>{`import { definePlugin } from '@zivo/plugin-sdk';

export default definePlugin({
  id: 'my-plugin',
  setup(ctx) {
    ctx.on('file:save', (file) => {
      console.log('File saved:', file.path);
    });
    ctx.registerCommand('my-plugin.hello', () => {
      ctx.notify('Hello from my plugin!');
    });
  },
});`}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
