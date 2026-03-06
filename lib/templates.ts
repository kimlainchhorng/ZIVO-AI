// lib/templates.ts — Project template library

export interface TemplateFile {
  path: string;
  content: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  stack: string[];
  files: TemplateFile[];
  tags: string[];
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "nextjs-saas",
    name: "Next.js SaaS Starter",
    description: "Full-stack SaaS boilerplate with auth, billing, and dashboard",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Stripe"],
    tags: ["saas", "fullstack", "auth", "billing"],
    files: [
      { path: "app/layout.tsx", content: `import type { Metadata } from "next";\nexport const metadata: Metadata = { title: "SaaS App" };\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return <html lang="en"><body>{children}</body></html>;\n}` },
      { path: "app/page.tsx", content: `export default function Home() { return <main><h1>SaaS Starter</h1></main>; }` },
      { path: "package.json", content: JSON.stringify({ name: "nextjs-saas", version: "0.1.0", scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { typescript: "^5.0.0", "@types/node": "^20.0.0", "@types/react": "^19.0.0" } }, null, 2) },
      { path: "tsconfig.json", content: JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true, noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "preserve", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./*"] } }, include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2) },
    ],
  },
  {
    id: "nextjs-blog",
    name: "Next.js Blog",
    description: "MDX-powered blog with SEO optimization",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "MDX"],
    tags: ["blog", "mdx", "seo", "static"],
    files: [
      { path: "app/layout.tsx", content: `export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }` },
      { path: "app/page.tsx", content: `export default function Home() { return <main><h1>My Blog</h1></main>; }` },
      { path: "app/blog/page.tsx", content: `export default function BlogIndex() { return <div><h1>Posts</h1></div>; }` },
      { path: "package.json", content: JSON.stringify({ name: "nextjs-blog", version: "0.1.0", scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0", "@next/mdx": "^15.0.0" } }, null, 2) },
    ],
  },
  {
    id: "nextjs-ecommerce",
    name: "Next.js E-Commerce",
    description: "Full e-commerce store with product catalog and checkout",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe"],
    tags: ["ecommerce", "stripe", "shop"],
    files: [
      { path: "app/layout.tsx", content: `export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }` },
      { path: "app/page.tsx", content: `export default function Home() { return <main><h1>Shop</h1></main>; }` },
      { path: "app/products/page.tsx", content: `export default function Products() { return <div><h1>Products</h1></div>; }` },
      { path: "package.json", content: JSON.stringify({ name: "nextjs-ecommerce", version: "0.1.0", scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0", stripe: "^15.0.0" } }, null, 2) },
    ],
  },
  {
    id: "react-dashboard",
    name: "React Dashboard",
    description: "Analytics dashboard with charts and data tables",
    stack: ["React", "TypeScript", "Recharts", "Tailwind CSS"],
    tags: ["dashboard", "analytics", "charts"],
    files: [
      { path: "src/App.tsx", content: `import React from "react";\nexport default function App() { return <div><h1>Dashboard</h1></div>; }` },
      { path: "src/main.tsx", content: `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);` },
      { path: "package.json", content: JSON.stringify({ name: "react-dashboard", version: "0.1.0", scripts: { dev: "vite", build: "vite build" }, dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", recharts: "^2.12.0" }, devDependencies: { vite: "^5.0.0", "@vitejs/plugin-react": "^4.0.0", typescript: "^5.0.0" } }, null, 2) },
    ],
  },
  {
    id: "api-only",
    name: "API-Only Backend",
    description: "Node.js REST API with TypeScript and Express",
    stack: ["Node.js", "TypeScript", "Express"],
    tags: ["api", "backend", "rest", "express"],
    files: [
      { path: "src/index.ts", content: `import express from "express";\nconst app = express();\napp.use(express.json());\napp.get("/health", (_req, res) => res.json({ status: "ok" }));\napp.listen(3000, () => console.log("Server on :3000"));` },
      { path: "package.json", content: JSON.stringify({ name: "api-only", version: "0.1.0", scripts: { dev: "ts-node src/index.ts", build: "tsc" }, dependencies: { express: "^4.18.0" }, devDependencies: { typescript: "^5.0.0", "@types/express": "^4.17.0", "@types/node": "^20.0.0", "ts-node": "^10.9.0" } }, null, 2) },
    ],
  },
  {
    id: "fullstack-auth",
    name: "Full-Stack with Auth",
    description: "Next.js app with complete authentication system",
    stack: ["Next.js", "TypeScript", "Supabase Auth", "Tailwind CSS"],
    tags: ["auth", "fullstack", "supabase"],
    files: [
      { path: "app/layout.tsx", content: `export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }` },
      { path: "app/login/page.tsx", content: `"use client";\nexport default function Login() { return <form><input type="email" placeholder="Email" /><input type="password" placeholder="Password" /><button type="submit">Login</button></form>; }` },
      { path: "app/dashboard/page.tsx", content: `export default function Dashboard() { return <div><h1>Dashboard</h1></div>; }` },
      { path: "package.json", content: JSON.stringify({ name: "fullstack-auth", version: "0.1.0", scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "^15.0.0", react: "^19.0.0", "@supabase/supabase-js": "^2.0.0" } }, null, 2) },
    ],
  },
  {
    id: "landing-page",
    name: "Landing Page",
    description: "High-converting SaaS landing page with Tailwind CSS",
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    tags: ["landing", "marketing", "seo"],
    files: [
      { path: "app/layout.tsx", content: `export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }` },
      { path: "app/page.tsx", content: `export default function Landing() { return <main><section className="hero"><h1>Build something amazing</h1><p>The best platform for your next project.</p><a href="#" className="btn">Get Started</a></section></main>; }` },
      { path: "package.json", content: JSON.stringify({ name: "landing-page", version: "0.1.0", scripts: { dev: "next dev", build: "next build" }, dependencies: { next: "^15.0.0", react: "^19.0.0", "framer-motion": "^11.0.0" } }, null, 2) },
    ],
  },
  {
    id: "mobile-app-backend",
    name: "Mobile App Backend",
    description: "REST API backend optimized for mobile applications",
    stack: ["Node.js", "TypeScript", "Express", "PostgreSQL"],
    tags: ["mobile", "backend", "api", "push-notifications"],
    files: [
      { path: "src/index.ts", content: `import express from "express";\nconst app = express();\napp.use(express.json());\napp.get("/api/v1/health", (_req, res) => res.json({ status: "ok", version: "1.0.0" }));\napp.listen(4000, () => console.log("Mobile backend on :4000"));` },
      { path: "package.json", content: JSON.stringify({ name: "mobile-app-backend", version: "0.1.0", scripts: { dev: "ts-node src/index.ts", build: "tsc" }, dependencies: { express: "^4.18.0", cors: "^2.8.5" }, devDependencies: { typescript: "^5.0.0", "@types/express": "^4.17.0", "@types/cors": "^2.8.0" } }, null, 2) },
    ],
  },
  {
    id: "chrome-extension",
    name: "Chrome Extension",
    description: "Manifest V3 Chrome extension with popup and background service worker",
    stack: ["TypeScript", "Chrome Extension API"],
    tags: ["chrome", "extension", "browser"],
    files: [
      { path: "manifest.json", content: JSON.stringify({ manifest_version: 3, name: "My Extension", version: "1.0", description: "A Chrome extension", action: { default_popup: "popup.html" }, background: { service_worker: "background.js" }, permissions: ["activeTab"] }, null, 2) },
      { path: "popup.html", content: `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Extension</title></head><body><h1>Extension</h1><script src="popup.js"></script></body></html>` },
      { path: "src/popup.ts", content: `document.addEventListener("DOMContentLoaded", () => { console.log("Popup loaded"); });` },
      { path: "src/background.ts", content: `chrome.runtime.onInstalled.addListener(() => { console.log("Extension installed"); });` },
      { path: "package.json", content: JSON.stringify({ name: "chrome-extension", version: "1.0.0", scripts: { build: "tsc" }, devDependencies: { typescript: "^5.0.0", "@types/chrome": "^0.0.260" } }, null, 2) },
    ],
  },
  {
    id: "cli-tool",
    name: "CLI Tool",
    description: "Node.js command-line tool with TypeScript",
    stack: ["Node.js", "TypeScript", "Commander.js"],
    tags: ["cli", "tool", "nodejs"],
    files: [
      { path: "src/index.ts", content: `#!/usr/bin/env node\nimport { Command } from "commander";\nconst program = new Command();\nprogram.name("my-cli").description("My CLI Tool").version("0.0.1");\nprogram.command("hello").description("Say hello").action(() => console.log("Hello, World!"));\nprogram.parse();` },
      { path: "package.json", content: JSON.stringify({ name: "cli-tool", version: "0.0.1", bin: { "my-cli": "./dist/index.js" }, scripts: { build: "tsc", start: "node dist/index.js" }, dependencies: { commander: "^12.0.0" }, devDependencies: { typescript: "^5.0.0", "@types/node": "^20.0.0" } }, null, 2) },
    ],
  },
];

/**
 * Returns all available project templates.
 */
export function getAllTemplates(): ProjectTemplate[] {
  return TEMPLATES;
}

/**
 * Returns a template by its ID.
 */
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
