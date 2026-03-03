'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <span className="text-xl font-bold tracking-tight">⚡ ZIVO AI</span>
        <div className="flex items-center gap-4">
          <a href="/ai" className="text-sm text-zinc-400 hover:text-white transition">Builder</a>
          <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition">Dashboard</a>
          <a href="/connectors" className="text-sm text-zinc-400 hover:text-white transition">Connectors</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-white transition">GitHub</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
          🚀 Powered by GPT-4o
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
          Build full-stack apps<br />with AI in seconds
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-10">
          Describe your app and ZIVO AI generates complete, production-ready Next.js code — with live preview, deployment, and voice input.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <a
            href="/ai"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-lg"
          >
            Start Building →
          </a>
          <a
            href="/dashboard"
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition text-lg border border-zinc-700"
          >
            View Dashboard
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need to ship faster</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: "🖥️", title: "Live Preview", desc: "See your app render in real-time as AI generates code. Visual edit mode lets you click any element to modify it." },
            { icon: "🤖", title: "Agent Mode", desc: "Multi-step AI agent that builds complete features, handles errors, and self-corrects TypeScript issues automatically." },
            { icon: "🔌", title: "Connectors", desc: "Integrate GitHub, Stripe, Supabase, ElevenLabs, Vercel, and Netlify with one click." },
            { icon: "🚀", title: "One-Click Deploy", desc: "Deploy directly to Vercel or Netlify from the builder. Your app goes live in seconds." },
            { icon: "🎙️", title: "Voice Input", desc: "Dictate your app idea using the microphone. Speech-to-text powered by the browser's Web Speech API." },
            { icon: "🧠", title: "Multi-Model", desc: "Choose between GPT-4.1-mini for speed, GPT-4o for power, or GPT-4o-mini for balance." },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to build something amazing?</h2>
        <p className="text-zinc-400 mb-8">Join thousands of developers building with AI.</p>
        <a
          href="/ai"
          className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition text-lg"
        >
          Start Building →
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-sm text-zinc-500">
        <p>
          © 2026 ZIVO AI ·{" "}
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition">
            GitHub
          </a>{" "}
          · Built with Next.js & GPT-4o
        </p>
      </footer>
    </div>
  );
}
