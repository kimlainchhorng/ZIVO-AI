'use client';
import NavBar from '../components/NavBar';
import { useState, useRef } from 'react';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

type Status = 'translated' | 'missing' | 'fuzzy';

interface TranslationEntry {
  key: string;
  english: string;
  status: Status;
}

const TRANSLATION_KEYS: TranslationEntry[] = [
  { key: 'welcome_message',  english: 'Welcome to ZIVO!',                   status: 'translated' },
  { key: 'sign_in_button',   english: 'Sign In',                             status: 'translated' },
  { key: 'error_required',   english: 'This field is required',              status: 'missing'    },
  { key: 'success_saved',    english: 'Changes saved successfully',          status: 'translated' },
  { key: 'nav_home',         english: 'Home',                                status: 'translated' },
  { key: 'nav_settings',     english: 'Settings',                            status: 'fuzzy'      },
  { key: 'user_profile',     english: 'User Profile',                        status: 'translated' },
  { key: 'export_data',      english: 'Export Data',                         status: 'missing'    },
  { key: 'delete_confirm',   english: 'Are you sure you want to delete?',    status: 'fuzzy'      },
  { key: 'loading_text',     english: 'Loading, please wait…',               status: 'missing'    },
];

const LANGUAGES = [
  { code: 'en', flag: '🇺🇸', name: 'English',  completion: 100, isBase: true },
  { code: 'es', flag: '🇪🇸', name: 'Spanish',  completion: 82,  isBase: false },
  { code: 'fr', flag: '🇫🇷', name: 'French',   completion: 74,  isBase: false },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese',  completion: 61,  isBase: false },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic',   completion: 45,  isBase: false },
];

const INITIAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: { welcome_message: '¡Bienvenido a ZIVO!', sign_in_button: 'Iniciar sesión', success_saved: 'Cambios guardados', nav_home: 'Inicio', user_profile: 'Perfil de usuario' },
  fr: { welcome_message: 'Bienvenue sur ZIVO!', sign_in_button: 'Se connecter', success_saved: 'Modifications enregistrées', nav_home: 'Accueil', user_profile: 'Profil utilisateur', nav_settings: 'Paramètres' },
  zh: { welcome_message: '欢迎使用 ZIVO！', sign_in_button: '登录', success_saved: '更改已保存', nav_home: '主页', delete_confirm: '确定要删除吗？' },
  ar: { welcome_message: 'مرحباً بك في ZIVO!', sign_in_button: 'تسجيل الدخول' },
};

const STATUS_CONFIG: Record<Status, { bg: string; color: string }> = {
  translated: { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  missing:    { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  fuzzy:      { bg: 'rgba(245,158,11,0.12)',   color: '#f59e0b' },
};

export default function I18nPage() {
  const [activeLang, setActiveLang] = useState('es');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(INITIAL_TRANSLATIONS);
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateTranslation(lang: string, key: string, value: string) {
    setTranslations(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value },
    }));
  }

  function getDisplayStatus(key: string, langCode: string): Status {
    if (langCode === 'en') return 'translated';
    const val = translations[langCode]?.[key];
    if (!val) return 'missing';
    const entry = TRANSLATION_KEYS.find(e => e.key === key);
    return entry?.status ?? 'translated';
  }

  function exportJSON() {
    const lang = LANGUAGES.find(l => l.code === activeLang);
    window.alert(`Exporting ${lang?.name ?? activeLang}.json…`);
  }

  const displayedKeys = showMissingOnly
    ? TRANSLATION_KEYS.filter(e => getDisplayStatus(e.key, activeLang) === 'missing')
    : TRANSLATION_KEYS;

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Localization (i18n)</h1>
        <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>Manage translations and localization for your application</p>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Language sidebar */}
          <div style={{ width: 200, flexShrink: 0, background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.border}` }}>Languages</div>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  padding: '11px 14px', border: 'none', background: activeLang === lang.code ? 'rgba(99,102,241,0.12)' : 'transparent',
                  borderLeft: activeLang === lang.code ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                  cursor: 'pointer', color: COLORS.textPrimary, textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 13 }}>{lang.flag} {lang.name}{lang.isBase ? ' (base)' : ''}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: lang.completion === 100 ? COLORS.success : lang.completion >= 70 ? COLORS.warning : COLORS.error }}>
                  {lang.completion}%
                </span>
              </button>
            ))}
          </div>

          {/* Translation table */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowMissingOnly(!showMissingOnly)}
                  style={{ background: showMissingOnly ? 'rgba(239,68,68,0.15)' : COLORS.bgCard, border: `1px solid ${showMissingOnly ? COLORS.error : COLORS.border}`, borderRadius: 8, color: showMissingOnly ? COLORS.error : COLORS.textSecondary, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}
                >
                  {showMissingOnly ? '✓ Missing Only' : 'Show Missing Only'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={exportJSON} style={{ background: 'rgba(99,102,241,0.15)', border: `1px solid ${COLORS.accent}`, borderRadius: 8, color: COLORS.accent, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Export JSON</button>
                <button onClick={() => fileInputRef.current?.click()} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textSecondary, padding: '7px 14px', cursor: 'pointer', fontSize: 13 }}>Import</button>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={() => window.alert('File imported (mock)')} />
              </div>
            </div>

            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: '22%' }}>Key</th>
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: '28%' }}>English (base)</th>
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Translation</th>
                    <th style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedKeys.map((entry, i) => {
                    const status = getDisplayStatus(entry.key, activeLang);
                    const scfg = STATUS_CONFIG[status];
                    const isBase = activeLang === 'en';
                    return (
                      <tr key={entry.key} style={{ borderBottom: i < displayedKeys.length - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 12, color: COLORS.textMuted }}>{entry.key}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: COLORS.textSecondary }}>{entry.english}</td>
                        <td style={{ padding: '10px 16px' }}>
                          {isBase ? (
                            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{entry.english}</span>
                          ) : (
                            <input
                              value={translations[activeLang]?.[entry.key] ?? ''}
                              onChange={e => updateTranslation(activeLang, entry.key, e.target.value)}
                              placeholder={`Translate to ${LANGUAGES.find(l => l.code === activeLang)?.name}…`}
                              style={{ width: '100%', background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.textPrimary, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }}
                            />
                          )}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: scfg.bg, color: scfg.color }}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
