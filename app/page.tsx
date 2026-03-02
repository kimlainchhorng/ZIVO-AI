import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">ZIVO AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">How it works</a>
            <Link
              href="/ai"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:scale-95"
            >
              Open Builder
            </Link>
          </nav>
          <Link href="/ai" className="md:hidden px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium">
            Open Builder
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Powered by GPT-4.1
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Build Websites &amp; Apps<br />
            <span className="text-yellow-300">with AI in Seconds</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/85 mb-10">
            Describe what you want to build and ZIVO AI generates production-ready code for websites and mobile apps instantly — no coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ai"
              className="px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-lg hover:bg-yellow-300 hover:text-indigo-900 active:scale-95 shadow-lg"
            >
              🚀 Start Building for Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border-2 border-white/50 text-white font-semibold text-lg hover:bg-white/10 active:scale-95"
            >
              See How It Works
            </a>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 50 960 60 720 50C480 40 240 10 0 0L0 60Z" fill="white" className="dark:fill-slate-900" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Build
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              ZIVO AI combines the power of GPT-4.1 with a professional builder UI to create stunning digital products.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🌐",
                title: "Website Builder",
                desc: "Generate complete, responsive HTML/CSS/JS websites from a single description. Perfect for landing pages, portfolios, and business sites.",
                color: "from-indigo-500 to-blue-600",
              },
              {
                icon: "📱",
                title: "Mobile App Builder",
                desc: "Create React Native and mobile-first UI layouts. Describe your app idea and get production-ready component code instantly.",
                color: "from-purple-500 to-pink-600",
              },
              {
                icon: "⚡",
                title: "Instant Generation",
                desc: "Go from idea to code in seconds. No waiting, no setup — just describe and build. Iterate rapidly with follow-up prompts.",
                color: "from-amber-500 to-orange-600",
              },
              {
                icon: "🎨",
                title: "Template Library",
                desc: "Jump-start your project with curated templates for common use cases: SaaS, portfolios, e-commerce, dashboards, and more.",
                color: "from-emerald-500 to-teal-600",
              },
              {
                icon: "📋",
                title: "Copy & Export",
                desc: "Copy generated code to clipboard with one click or export your project. Paste directly into your favorite editor.",
                color: "from-cyan-500 to-sky-600",
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                desc: "Your prompts and generated code stay private. Password-protected builder access ensures your projects are safe.",
                color: "from-rose-500 to-red-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Three simple steps to your next digital project
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Choose Your Mode", desc: "Select Website Builder or Mobile App Builder depending on what you want to create.", icon: "🎯" },
              { step: "2", title: "Describe Your Vision", desc: "Type a detailed description of what you want. Use a template or write your own prompt.", icon: "✍️" },
              { step: "3", title: "Get Your Code", desc: "ZIVO AI generates clean, production-ready code. Copy it, export it, or keep refining.", icon: "🎉" },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg">
                  {item.step}
                </div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Build Something Amazing?</h2>
          <p className="text-lg text-white/85 mb-8">
            Join thousands of developers and creators building with ZIVO AI.
          </p>
          <Link
            href="/ai"
            className="inline-block px-10 py-4 rounded-xl bg-white text-indigo-700 font-bold text-lg hover:bg-yellow-300 hover:text-indigo-900 active:scale-95 shadow-xl"
          >
            🚀 Start Building Now — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">Z</span>
              </div>
              <span className="text-white font-bold text-lg">ZIVO AI</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/ai" className="hover:text-white">Builder</Link>
              <a href="#features" className="hover:text-white">Features</a>
              <a href="#how-it-works" className="hover:text-white">How It Works</a>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} ZIVO AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
