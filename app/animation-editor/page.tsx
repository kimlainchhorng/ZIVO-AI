'use client';
import { useState } from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

type Preset = 'fade' | 'slide' | 'bounce' | 'scale';

type MotionValues = { opacity?: number; x?: number; y?: number; scale?: number };

const PRESETS: Preset[] = ['fade', 'slide', 'bounce', 'scale'];

const presetVariants: Record<Preset, { initial: MotionValues; animate: MotionValues; transition?: Transition }> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slide: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
  bounce: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring', bounce: 0.5 } },
  scale: { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: 1, scale: 1 } },
};

export default function AnimationEditorPage() {
  const [preset, setPreset] = useState<Preset>('fade');
  const [duration, setDuration] = useState(0.5);
  const [delay, setDelay] = useState(0);
  const [visible, setVisible] = useState(true);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerPreview = () => {
    setVisible(false);
    setTimeout(() => setVisible(true), 50);
  };

  const { initial, animate, transition: presetTransition } = presetVariants[preset];
  const transition: Transition = { duration, delay, ...(presetTransition ?? {}) };

  const fetchCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/animation-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset, duration, delay }),
      });
      const data = await res.json() as { code?: string; error?: string };
      setCode(data.code ?? data.error ?? '');
    } catch {
      setCode('// Error generating code');
    }
    setLoading(false);
  };

  const fallbackCode = `import { motion } from 'framer-motion';

export function AnimatedComponent() {
  return (
    <motion.div
      initial={${JSON.stringify(initial)}}
      animate={${JSON.stringify(animate)}}
      transition={${JSON.stringify(transition)}}
    >
      Your content
    </motion.div>
  );
}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Animation Editor</h1>
      <p className="text-gray-500 text-sm mb-8">Configure Framer Motion animations and generate code.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Preset</p>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => { setPreset(p); setVisible(false); setTimeout(() => setVisible(true), 50); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                    preset === p ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#222]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Duration: <span className="text-white font-mono">{duration}s</span>
            </label>
            <input
              type="range" min={0.1} max={2} step={0.1}
              value={duration}
              onChange={e => setDuration(parseFloat(e.target.value))}
              className="w-full accent-[#6366f1]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Delay: <span className="text-white font-mono">{delay}s</span>
            </label>
            <input
              type="range" min={0} max={2} step={0.1}
              value={delay}
              onChange={e => setDelay(parseFloat(e.target.value))}
              className="w-full accent-[#6366f1]"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={triggerPreview}
              className="px-4 py-2 bg-[#1a1a1a] border border-white/10 hover:bg-[#222] rounded-lg text-sm transition"
            >
              ▶ Replay
            </button>
            <button
              onClick={fetchCode}
              disabled={loading}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#5254cc] rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate Code'}
            </button>
          </div>
        </section>

        {/* Preview + code */}
        <section className="flex flex-col gap-4">
          <div className="bg-[#111] rounded-xl border border-white/10 p-5 h-40 flex items-center justify-center">
            <AnimatePresence>
              {visible && (
                <motion.div
                  key={`${preset}-${duration}-${delay}`}
                  initial={initial}
                  animate={animate}
                  transition={transition}
                  className="px-6 py-3 bg-[#6366f1] rounded-xl text-white font-semibold text-sm"
                >
                  Animated Element
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-[#111] rounded-xl border border-white/10 p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Framer Motion Code</p>
              <button
                onClick={() => navigator.clipboard.writeText(code || fallbackCode)}
                className="text-xs text-[#6366f1] hover:underline"
              >
                Copy
              </button>
            </div>
            <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap bg-[#0a0a0a] rounded p-3">
              {code || fallbackCode}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
