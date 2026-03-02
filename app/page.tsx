export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white font-sans px-6 py-20">
      <h1 className="text-5xl font-black tracking-tight mb-4 text-center">
        ZIVO<span style={{ color: "#818cf8" }}> AI</span>
      </h1>
      <p className="text-lg max-w-xl text-center mb-10" style={{ color: "#a1a1aa" }}>
        The ultimate AI platform — 20+ market verticals, 50+ countries,
        500+ integrations, next-gen AI, no-code tools, enterprise suite, and
        more.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <a
          href="/dashboard"
          className="px-8 py-3 rounded-full font-bold text-white transition-colors"
          style={{ background: "#4f46e5" }}
        >
          Open Dashboard
        </a>
        <a
          href="/ai"
          className="px-8 py-3 rounded-full font-bold transition-colors"
          style={{ border: "1px solid #3f3f46", color: "#d4d4d8" }}
        >
          AI Builder
        </a>
      </div>
    </div>
  );
}
