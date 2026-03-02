export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black dark:text-white">ZIVO AI</h1>
          <p className="mt-2 text-zinc-500">Advanced multi-agent AI system</p>
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="max-w-xs text-2xl font-semibold leading-9 tracking-tight text-black dark:text-zinc-50">
            Build apps with an AI team
          </h2>
          <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
            ZIVO AI orchestrates specialized agents — Architect, UI, Backend, Database, Security, Performance, DevOps, and Code Review — to design and build your applications.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["🏛️ Architect", "Design decisions & architecture"],
              ["🎨 UI Agent", "React component generation"],
              ["⚙️ Backend Agent", "API & server logic"],
              ["🗄️ Database Agent", "Supabase schemas & RLS"],
              ["🔒 Security Agent", "Vulnerability scanning"],
              ["⚡ Performance Agent", "Optimization"],
              ["🚀 DevOps Agent", "Deployment & CI/CD"],
              ["🔍 Code Review", "Quality assurance"],
            ].map(([name, desc]) => (
              <div key={name} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">{name}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-white transition-colors hover:bg-zinc-700 md:w-auto"
            href="/agents"
          >
            Open Agent Monitor
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-auto"
            href="/ai"
          >
            AI Builder
          </a>
        </div>
      </main>
    </div>
  );
}
