'use client';
import { useState } from 'react';

type EventType = 'click' | 'hover' | 'scroll';
type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce';

const EVENTS: EventType[] = ['click', 'hover', 'scroll'];
const ANIMATIONS: AnimationType[] = ['fade', 'slide', 'scale', 'rotate', 'bounce'];

export default function InteractionBuilderPage() {
  const [event, setEvent] = useState<EventType>('click');
  const [animation, setAnimation] = useState<AnimationType>('fade');
  const [target, setTarget] = useState('.my-element');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interaction-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, animation, target }),
      });
      const data = await res.json() as { code?: string; error?: string };
      setCode(data.code ?? data.error ?? '');
    } catch {
      setCode('// Error generating code');
    }
    setLoading(false);
  };

  const fallbackCode = `import { motion } from 'framer-motion';
import { useState } from 'react';

export function InteractiveElement() {
  const [isActive, setIsActive] = useState(false);

  return (
    <motion.div
      className="${target.replace(/^\./, '')}"
      ${event === 'hover' ? 'whileHover' : event === 'click' ? 'whileTap' : 'whileInView'}={${JSON.stringify(
        animation === 'fade' ? { opacity: 0.8 }
        : animation === 'scale' ? { scale: 1.05 }
        : animation === 'rotate' ? { rotate: 5 }
        : animation === 'slide' ? { x: 10 }
        : { y: -5 }
      )}}
      ${event === 'click' ? `onClick={() => setIsActive(!isActive)}` : ''}
    >
      {/* content */}
    </motion.div>
  );
}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-2">Interaction Builder</h1>
      <p className="text-gray-500 text-sm mb-8">Build Framer Motion interactions visually.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Trigger Event</p>
            <div className="flex gap-2">
              {EVENTS.map(e => (
                <button
                  key={e}
                  onClick={() => setEvent(e)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                    event === e ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#222]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Animation Type</p>
            <div className="flex gap-2 flex-wrap">
              {ANIMATIONS.map(a => (
                <button
                  key={a}
                  onClick={() => setAnimation(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                    animation === a ? 'bg-[#6366f1] text-white' : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#222]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Target Element</label>
            <input
              value={target}
              onChange={e => setTarget(e.target.value)}
              placeholder=".my-element"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#6366f1]"
            />
          </div>

          <button
            onClick={generateCode}
            disabled={loading}
            className="px-4 py-2 bg-[#6366f1] hover:bg-[#5254cc] rounded-lg text-sm font-semibold transition disabled:opacity-50 self-start"
          >
            {loading ? 'Generating…' : '⚡ Generate Code'}
          </button>
        </section>

        {/* Code preview */}
        <section className="bg-[#111] rounded-xl border border-white/10 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Generated Code</p>
            <button
              onClick={() => navigator.clipboard.writeText(code || fallbackCode)}
              className="text-xs text-[#6366f1] hover:underline"
            >
              Copy
            </button>
          </div>
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-[#1a1a1a] rounded">{event}</span>
            <span className="px-2 py-0.5 bg-[#1a1a1a] rounded">{animation}</span>
            <span className="px-2 py-0.5 bg-[#1a1a1a] rounded font-mono">{target}</span>
          </div>
          <pre className="flex-1 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap bg-[#0a0a0a] rounded p-3">
            {code || fallbackCode}
          </pre>
        </section>
      </div>
    </main>
  );
}
