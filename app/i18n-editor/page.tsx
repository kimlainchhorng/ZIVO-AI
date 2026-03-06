'use client';
import { useState, useRef } from 'react';

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'zh'];

interface Translation {
  key: string;
  [lang: string]: string;
}

const INITIAL_TRANSLATIONS: Translation[] = [
  { key: 'greeting', en: 'Hello', es: 'Hola', fr: 'Bonjour', de: '', ja: '', zh: '' },
  { key: 'farewell', en: 'Goodbye', es: '', fr: 'Au revoir', de: 'Auf Wiedersehen', ja: '', zh: '' },
  { key: 'submit', en: 'Submit', es: 'Enviar', fr: 'Soumettre', de: 'Einreichen', ja: '送信', zh: '提交' },
];

export default function I18nEditor() {
  const [activeLangs, setActiveLangs] = useState<string[]>(['en', 'es', 'fr']);
  const [translations, setTranslations] = useState<Translation[]>(INITIAL_TRANSLATIONS);
  const [translating, setTranslating] = useState(false);
  const [newLang, setNewLang] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Suppress unused variable warning for LANGUAGES
  void LANGUAGES;

  function updateCell(rowIdx: number, lang: string, val: string) {
    setTranslations((prev) => prev.map((row, i) => i === rowIdx ? { ...row, [lang]: val } : row));
  }

  function addRow() {
    setTranslations((prev) => [...prev, { key: `key_${prev.length + 1}`, ...Object.fromEntries(activeLangs.map((l) => [l, ''])) }]);
  }

  function addLanguage() {
    const lang = newLang.trim().toLowerCase();
    if (!lang || activeLangs.includes(lang)) return;
    setActiveLangs((prev) => [...prev, lang]);
    setTranslations((prev) => prev.map((row) => ({ ...row, [lang]: '' })));
    setNewLang('');
  }

  function removeLang(lang: string) {
    if (lang === 'en') return;
    setActiveLangs((prev) => prev.filter((l) => l !== lang));
  }

  async function autoTranslate() {
    setTranslating(true);
    const keys: Record<string, string> = {};
    translations.forEach((t) => { if (t.en) keys[t.key] = t.en; });
    const nonEnLangs = activeLangs.filter((l) => l !== 'en');
    for (const targetLang of nonEnLangs) {
      const res = await fetch('/api/i18n-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', keys, targetLang }),
      });
      const data = await res.json() as { result?: string };
      try {
        const translated = JSON.parse(data.result ?? '{}') as Record<string, string>;
        setTranslations((prev) => prev.map((row) => ({ ...row, [targetLang]: translated[row.key] ?? row[targetLang] ?? '' })));
      } catch { /* ignore parse errors */ }
    }
    setTranslating(false);
  }

  function exportJSON() {
    const out: Record<string, Record<string, string>> = {};
    activeLangs.forEach((lang) => {
      out[lang] = {};
      translations.forEach((t) => { out[lang][t.key] = t[lang] ?? ''; });
    });
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'translations.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Record<string, Record<string, string>>;
        const langs = Object.keys(parsed);
        const keys = [...new Set(langs.flatMap((l) => Object.keys(parsed[l])))];
        setActiveLangs(langs);
        setTranslations(keys.map((k) => ({ key: k, ...Object.fromEntries(langs.map((l) => [l, parsed[l]?.[k] ?? ''])) })));
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Localization Editor</h1>
      <p className="text-gray-400 mb-4">Manage translations with AI auto-translate</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {activeLangs.map((lang) => (
          <span key={lang} className="flex items-center gap-1 bg-[#1a1a1a] border border-gray-700 rounded-full px-3 py-1 text-sm">
            {lang.toUpperCase()}
            {lang !== 'en' && (
              <button onClick={() => removeLang(lang)} className="text-gray-500 hover:text-red-400 ml-1">×</button>
            )}
          </span>
        ))}
        <div className="flex items-center gap-1">
          <input value={newLang} onChange={(e) => setNewLang(e.target.value)}
            placeholder="Add lang (e.g. pt)"
            className="w-32 bg-[#1a1a1a] border border-gray-700 rounded-l-full px-3 py-1 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6366f1]" />
          <button onClick={addLanguage} className="bg-[#6366f1] px-3 py-1 rounded-r-full text-sm hover:bg-[#5254cc]">+</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={autoTranslate} disabled={translating}
          className="px-4 py-2 rounded-lg bg-[#6366f1] hover:bg-[#5254cc] text-sm font-medium disabled:opacity-50 transition-colors">
          {translating ? 'Translating…' : '✨ AI Auto-Translate'}
        </button>
        <button onClick={addRow} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors">+ Add Key</button>
        <button onClick={exportJSON} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors">Export JSON</button>
        <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors">Import JSON</button>
        <input ref={fileRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 pr-4 text-gray-400 font-medium w-32">Key</th>
              {activeLangs.map((lang) => (
                <th key={lang} className="text-left py-2 px-2 text-gray-400 font-medium">{lang.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {translations.map((row, ri) => (
              <tr key={ri} className="border-b border-gray-900 hover:bg-[#111]">
                <td className="py-2 pr-4">
                  <input value={row.key} onChange={(e) => updateCell(ri, 'key', e.target.value)}
                    className="bg-transparent text-gray-300 focus:outline-none w-full font-mono text-xs" />
                </td>
                {activeLangs.map((lang) => {
                  const val = row[lang] ?? '';
                  const missing = lang !== 'en' && !val;
                  return (
                    <td key={lang} className="py-2 px-2">
                      <input value={val} onChange={(e) => updateCell(ri, lang, e.target.value)}
                        className={`w-full bg-transparent focus:outline-none focus:border-b focus:border-[#6366f1] ${missing ? 'text-red-400 placeholder-red-900' : 'text-white'}`}
                        placeholder={missing ? 'Missing' : ''} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
