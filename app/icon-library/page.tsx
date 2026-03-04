'use client';
import { useState, useMemo } from 'react';
import {
  Home, Settings, User, Search, Bell, Mail, Heart, Star,
  Download, Upload, Trash, Edit, Plus, Minus, Check, X,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  Sun, Moon, Globe, Lock, Unlock, Eye, EyeOff,
  Play, Pause, Square, SkipForward, SkipBack,
  Folder, File, Image, Video, Music, Code,
  Zap, Shield, Database, Cloud, Terminal, Cpu,
  type LucideIcon,
} from 'lucide-react';

interface IconEntry {
  name: string;
  Icon: LucideIcon;
}

const ICONS: IconEntry[] = [
  { name: 'Home', Icon: Home }, { name: 'Settings', Icon: Settings }, { name: 'User', Icon: User },
  { name: 'Search', Icon: Search }, { name: 'Bell', Icon: Bell }, { name: 'Mail', Icon: Mail },
  { name: 'Heart', Icon: Heart }, { name: 'Star', Icon: Star }, { name: 'Download', Icon: Download },
  { name: 'Upload', Icon: Upload }, { name: 'Trash', Icon: Trash }, { name: 'Edit', Icon: Edit },
  { name: 'Plus', Icon: Plus }, { name: 'Minus', Icon: Minus }, { name: 'Check', Icon: Check },
  { name: 'X', Icon: X }, { name: 'ChevronDown', Icon: ChevronDown }, { name: 'ChevronUp', Icon: ChevronUp },
  { name: 'ChevronLeft', Icon: ChevronLeft }, { name: 'ChevronRight', Icon: ChevronRight },
  { name: 'ArrowLeft', Icon: ArrowLeft }, { name: 'ArrowRight', Icon: ArrowRight },
  { name: 'ArrowUp', Icon: ArrowUp }, { name: 'ArrowDown', Icon: ArrowDown },
  { name: 'Sun', Icon: Sun }, { name: 'Moon', Icon: Moon }, { name: 'Globe', Icon: Globe },
  { name: 'Lock', Icon: Lock }, { name: 'Unlock', Icon: Unlock }, { name: 'Eye', Icon: Eye },
  { name: 'EyeOff', Icon: EyeOff }, { name: 'Play', Icon: Play }, { name: 'Pause', Icon: Pause },
  { name: 'Stop', Icon: Square }, { name: 'SkipForward', Icon: SkipForward }, { name: 'SkipBack', Icon: SkipBack },
  { name: 'Folder', Icon: Folder }, { name: 'File', Icon: File }, { name: 'Image', Icon: Image },
  { name: 'Video', Icon: Video }, { name: 'Music', Icon: Music }, { name: 'Code', Icon: Code },
  { name: 'Zap', Icon: Zap }, { name: 'Shield', Icon: Shield }, { name: 'Database', Icon: Database },
  { name: 'Cloud', Icon: Cloud }, { name: 'Terminal', Icon: Terminal }, { name: 'Cpu', Icon: Cpu },
];

export default function IconLibraryPage() {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');

  const filtered = useMemo(
    () => ICONS.filter(i => i.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const copyImport = (name: string) => {
    const stmt = `import { ${name} } from 'lucide-react';`;
    navigator.clipboard.writeText(stmt);
    setCopied(name);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Icon Library</h1>
      <p className="text-gray-500 text-sm mb-6">Click any icon to copy its import statement.</p>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search icons…"
          className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6366f1]"
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
        {filtered.map(({ name, Icon }) => (
          <button
            key={name}
            onClick={() => copyImport(name)}
            title={`import { ${name} } from 'lucide-react'`}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition group ${
              copied === name
                ? 'border-[#6366f1] bg-[#6366f1]/10 text-[#6366f1]'
                : 'border-white/10 bg-[#111] hover:border-[#6366f1]/50 hover:bg-[#6366f1]/5 text-gray-300'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] text-center leading-tight truncate w-full">{name}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-600 text-sm mt-8">No icons match &quot;{query}&quot;</p>
      )}

      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#6366f1] text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          Copied: import &#123; {copied} &#125; from &apos;lucide-react&apos;
        </div>
      )}
    </main>
  );
}
