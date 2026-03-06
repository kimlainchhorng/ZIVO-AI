// ─── Types ────────────────────────────────────────────────────────────────────

export type LayoutType =
  | "dashboard"
  | "auth"
  | "ecommerce"
  | "admin"
  | "landing"
  | "saas"
  | "blog"
  | "portfolio";

export interface LayoutTemplate {
  type: LayoutType;
  name: string;
  description: string;
  files: { path: string; content: string }[];
  previewHtml: string;
}

// ─── Template Definitions ─────────────────────────────────────────────────────

const dashboardTemplate: LayoutTemplate = {
  type: "dashboard",
  name: "Dashboard",
  description: "Analytics dashboard with sidebar navigation and data widgets.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Analytics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen flex\`}>
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 shrink-0">
          <div className="text-indigo-400 font-bold text-xl mb-8">App</div>
          <nav className="flex flex-col gap-2 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-50 px-3 py-2 rounded-md hover:bg-zinc-800">Overview</a>
            <a href="#" className="hover:text-zinc-50 px-3 py-2 rounded-md hover:bg-zinc-800">Analytics</a>
            <a href="#" className="hover:text-zinc-50 px-3 py-2 rounded-md hover:bg-zinc-800">Reports</a>
            <a href="#" className="hover:text-zinc-50 px-3 py-2 rounded-md hover:bg-zinc-800">Settings</a>
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-50 mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {["Total Users", "Revenue", "Active Sessions", "Conversion"].map((label) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-2xl font-semibold text-zinc-50">—</p>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-64 flex items-center justify-center">
        <span className="text-zinc-500">Chart placeholder</span>
      </div>
    </div>
  );
}
`,
    },
  ],
  previewHtml: `<div style="display:flex;height:100%;font-family:sans-serif;background:#09090b;color:#fafafa">
  <div style="width:160px;background:#18181b;border-right:1px solid #27272a;padding:12px">
    <div style="color:#818cf8;font-weight:700;margin-bottom:16px">App</div>
    <div style="font-size:11px;color:#71717a;display:flex;flex-direction:column;gap:4px">
      <span style="background:#27272a;padding:4px 8px;border-radius:4px;color:#fafafa">Overview</span>
      <span style="padding:4px 8px">Analytics</span><span style="padding:4px 8px">Reports</span>
    </div>
  </div>
  <div style="flex:1;padding:16px">
    <div style="font-weight:700;margin-bottom:12px">Overview</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:10px"><div style="font-size:9px;color:#71717a">USERS</div><div style="font-weight:600">—</div></div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:10px"><div style="font-size:9px;color:#71717a">REVENUE</div><div style="font-weight:600">—</div></div>
    </div>
  </div>
</div>`,
};

const authTemplate: LayoutTemplate = {
  type: "auth",
  name: "Auth",
  description: "Authentication pages — sign in, sign up, and password reset.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sign In",
  description: "Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen flex items-center justify-center\`}>
        {children}
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `export default function SignInPage() {
  return (
    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
      <div className="text-center mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl mx-auto mb-3" />
        <h1 className="text-xl font-bold text-zinc-50">Welcome back</h1>
        <p className="text-sm text-zinc-400 mt-1">Sign in to your account</p>
      </div>
      <form className="flex flex-col gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          Sign in
        </button>
      </form>
      <p className="text-center text-xs text-zinc-500 mt-4">
        Don&apos;t have an account?{" "}
        <a href="#" className="text-indigo-400 hover:underline">Sign up</a>
      </p>
    </div>
  );
}
`,
    },
  ],
  previewHtml: `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#09090b;font-family:sans-serif">
  <div style="width:200px;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;text-align:center">
    <div style="width:28px;height:28px;background:#4f46e5;border-radius:8px;margin:0 auto 8px"></div>
    <div style="font-weight:700;color:#fafafa;margin-bottom:4px">Welcome back</div>
    <div style="font-size:10px;color:#71717a;margin-bottom:12px">Sign in to your account</div>
    <div style="background:#27272a;border-radius:6px;padding:6px 8px;font-size:10px;color:#52525b;margin-bottom:6px;text-align:left">Email</div>
    <div style="background:#27272a;border-radius:6px;padding:6px 8px;font-size:10px;color:#52525b;margin-bottom:10px;text-align:left">Password</div>
    <div style="background:#4f46e5;color:#fff;border-radius:6px;padding:6px;font-size:10px;font-weight:600">Sign in</div>
  </div>
</div>`,
};

const ecommerceTemplate: LayoutTemplate = {
  type: "ecommerce",
  name: "E-commerce",
  description: "Product catalog and storefront with cart and navigation.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Store",
  description: "Online store",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen\`}>
        <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <span className="font-bold text-lg text-indigo-400">Store</span>
          <nav className="hidden md:flex gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-50">Products</a>
            <a href="#" className="hover:text-zinc-50">Collections</a>
            <a href="#" className="hover:text-zinc-50">About</a>
          </nav>
          <button className="relative text-zinc-400 hover:text-zinc-50" aria-label="Cart">
            🛒{" "}
            <span aria-hidden="true" className="absolute -top-1 -right-2 bg-indigo-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">0</span>
            <span className="sr-only">0 items in cart</span>
          </button>
        </header>
        <main>{children}</main>
        <footer className="border-t border-zinc-800 text-center py-6 text-xs text-zinc-500 mt-16">
          © {new Date().getFullYear()} Store. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const PRODUCTS = [
  { id: 1, name: "Product One", price: "$29.00" },
  { id: 2, name: "Product Two", price: "$49.00" },
  { id: 3, name: "Product Three", price: "$79.00" },
  { id: 4, name: "Product Four", price: "$99.00" },
];

export default function StorefrontPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-zinc-50 mb-2">New Arrivals</h1>
      <p className="text-zinc-400 mb-8">Explore our latest collection.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-indigo-500 transition-colors group">
            <div className="aspect-square bg-zinc-800 flex items-center justify-center">
              <span className="text-zinc-600 text-sm">Image</span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-zinc-50 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
              <p className="text-sm text-zinc-400 mt-1">{p.price}</p>
              <button className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                Add to cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
    },
  ],
  previewHtml: `<div style="background:#09090b;font-family:sans-serif;height:100%">
  <div style="background:#18181b;border-bottom:1px solid #27272a;padding:8px 12px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#818cf8;font-weight:700">Store</span>
    <span style="color:#71717a;font-size:10px">Products · Collections</span>
    <span style="color:#71717a;font-size:12px">🛒</span>
  </div>
  <div style="padding:12px">
    <div style="color:#fafafa;font-weight:700;margin-bottom:8px">New Arrivals</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;overflow:hidden">
        <div style="height:50px;background:#27272a"></div>
        <div style="padding:6px"><div style="font-size:10px;color:#fafafa">Product One</div><div style="font-size:9px;color:#71717a">$29.00</div></div>
      </div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;overflow:hidden">
        <div style="height:50px;background:#27272a"></div>
        <div style="padding:6px"><div style="font-size:10px;color:#fafafa">Product Two</div><div style="font-size:9px;color:#71717a">$49.00</div></div>
      </div>
    </div>
  </div>
</div>`,
};

const adminTemplate: LayoutTemplate = {
  type: "admin",
  name: "Admin Panel",
  description: "Back-office admin panel with data tables and management views.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Back-office administration",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen\`}>
        <div className="flex h-screen overflow-hidden">
          <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
            <div className="px-4 py-5 border-b border-zinc-800">
              <span className="font-bold text-indigo-400">Admin</span>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-1 text-sm text-zinc-400">
              {["Users", "Orders", "Products", "Analytics", "Settings"].map((item) => (
                <a key={item} href="#" className="px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-zinc-50 transition-colors">
                  {item}
                </a>
              ))}
            </nav>
            <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">v1.0.0</div>
          </aside>
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-900 shrink-0">
              <h1 className="font-semibold text-zinc-50">Management Console</h1>
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">A</div>
            </header>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const USERS = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "Active" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "Viewer", status: "Inactive" },
];

export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-zinc-50">Users</h2>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Add User
        </button>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800">
            <tr className="text-zinc-400 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3 text-zinc-50 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                <td className="px-4 py-3 text-zinc-400">{user.role}</td>
                <td className="px-4 py-3">
                  <span className={\`text-xs px-2 py-0.5 rounded-full font-medium \${user.status === "Active" ? "bg-emerald-900/50 text-emerald-400" : "bg-zinc-800 text-zinc-400"}\`}>
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`,
    },
  ],
  previewHtml: `<div style="display:flex;height:100%;font-family:sans-serif;background:#09090b">
  <div style="width:120px;background:#18181b;border-right:1px solid #27272a;padding:10px">
    <div style="color:#818cf8;font-weight:700;margin-bottom:10px;font-size:12px">Admin</div>
    <div style="font-size:10px;color:#71717a;display:flex;flex-direction:column;gap:3px">
      <span style="background:#27272a;padding:3px 6px;border-radius:4px;color:#fafafa">Users</span>
      <span style="padding:3px 6px">Orders</span><span style="padding:3px 6px">Products</span>
    </div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column">
    <div style="background:#18181b;border-bottom:1px solid #27272a;padding:8px 12px;font-size:11px;font-weight:600;color:#fafafa">Management Console</div>
    <div style="padding:12px;flex:1">
      <div style="font-weight:700;color:#fafafa;margin-bottom:8px;font-size:12px">Users</div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;overflow:hidden;font-size:9px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;padding:6px 8px;color:#71717a;border-bottom:1px solid #27272a">
          <span>Name</span><span>Email</span><span>Status</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;padding:6px 8px;color:#fafafa;border-bottom:1px solid #27272a">
          <span>Alice</span><span style="color:#71717a">alice@…</span><span style="color:#34d399">Active</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
};

const landingTemplate: LayoutTemplate = {
  type: "landing",
  name: "Landing Page",
  description: "Marketing landing page with hero, features, and CTA sections.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Product — Build something great",
  description: "The fastest way to build your next product.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50\`}>
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-bold text-lg text-indigo-400">Product</span>
            <nav className="hidden md:flex gap-8 text-sm text-zinc-400">
              <a href="#features" className="hover:text-zinc-50">Features</a>
              <a href="#pricing" className="hover:text-zinc-50">Pricing</a>
              <a href="#docs" className="hover:text-zinc-50">Docs</a>
            </nav>
            <div className="flex items-center gap-3">
              <a href="/login" className="text-sm text-zinc-400 hover:text-zinc-50">Sign in</a>
              <a href="/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg font-medium transition-colors">
                Get started
              </a>
            </div>
          </div>
        </header>
        <main className="pt-16">{children}</main>
        <footer className="border-t border-zinc-800 py-10 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Product Inc. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const FEATURES = [
  { title: "Fast", description: "Blazing-fast performance out of the box." },
  { title: "Secure", description: "Enterprise-grade security by default." },
  { title: "Scalable", description: "Grows with your business seamlessly." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center text-center px-6">
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 rounded-full px-4 py-1.5 text-xs text-indigo-300 mb-6">
          ✨ Now in public beta
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-zinc-50 max-w-3xl leading-tight mb-4">
          Build something{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            remarkable
          </span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl mb-8">
          The fastest way to ship your next product. From idea to production in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
            Start for free
          </a>
          <a href="/docs" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-6 py-3 rounded-xl font-medium transition-colors">
            View docs
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-2xl font-bold text-zinc-50 text-center mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-700 transition-colors">
              <div className="w-10 h-10 bg-indigo-900/60 rounded-xl mb-4 flex items-center justify-center text-indigo-400 font-bold text-lg">
                {f.title[0]}
              </div>
              <h3 className="font-semibold text-zinc-50 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
`,
    },
  ],
  previewHtml: `<div style="background:#09090b;font-family:sans-serif;height:100%">
  <div style="background:rgba(9,9,11,0.8);border-bottom:1px solid #27272a;padding:8px 12px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#818cf8;font-weight:700">Product</span>
    <span style="font-size:10px;color:#71717a">Features · Pricing · Docs</span>
    <span style="background:#4f46e5;color:#fff;font-size:9px;padding:3px 8px;border-radius:6px">Get started</span>
  </div>
  <div style="text-align:center;padding:20px 12px">
    <div style="font-size:16px;font-weight:700;color:#fafafa;margin-bottom:6px">Build something <span style="color:#818cf8">remarkable</span></div>
    <div style="font-size:9px;color:#71717a;margin-bottom:12px">Ship your next product in minutes.</div>
    <div style="display:flex;gap:6px;justify-content:center">
      <div style="background:#4f46e5;color:#fff;font-size:9px;padding:5px 10px;border-radius:6px">Start free</div>
      <div style="background:#27272a;color:#fafafa;font-size:9px;padding:5px 10px;border-radius:6px">View docs</div>
    </div>
  </div>
</div>`,
};

const saasTemplate: LayoutTemplate = {
  type: "saas",
  name: "SaaS App",
  description: "SaaS application shell with top nav, workspace switcher, and content area.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaaS App",
  description: "Your SaaS application",
};

export default function SaasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen\`}>
        <div className="flex h-screen overflow-hidden">
          <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
            <div className="px-4 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-zinc-700 transition-colors">
                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold">W</div>
                <span className="text-sm font-medium flex-1">Workspace</span>
                <span className="text-zinc-500 text-xs">▾</span>
              </div>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-1 text-sm text-zinc-400">
              {["Home", "Projects", "Team", "Billing", "Settings"].map((item) => (
                <a key={item} href="#" className="px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-zinc-50 transition-colors">
                  {item}
                </a>
              ))}
            </nav>
            <div className="p-3 border-t border-zinc-800">
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors">
                <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">U</div>
                <div>
                  <p className="text-xs font-medium text-zinc-50">User Name</p>
                  <p className="text-xs text-zinc-500">user@example.com</p>
                </div>
              </div>
            </div>
          </aside>
          <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const PROJECTS = [
  { id: 1, name: "Alpha", description: "Main product", status: "Active" },
  { id: 2, name: "Beta", description: "Experimental feature", status: "Draft" },
  { id: 3, name: "Gamma", description: "Internal tool", status: "Active" },
];

export default function SaasHomePage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Home</h1>
          <p className="text-sm text-zinc-400 mt-1">Welcome back, User</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROJECTS.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-indigo-600 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-900/60 flex items-center justify-center text-indigo-400 font-bold text-sm">{p.name[0]}</div>
              <span className={\`text-xs px-2 py-0.5 rounded-full \${p.status === "Active" ? "bg-emerald-900/50 text-emerald-400" : "bg-zinc-800 text-zinc-400"}\`}>{p.status}</span>
            </div>
            <h3 className="font-semibold text-zinc-50 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
            <p className="text-sm text-zinc-400 mt-1">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`,
    },
  ],
  previewHtml: `<div style="display:flex;height:100%;font-family:sans-serif;background:#09090b">
  <div style="width:130px;background:#18181b;border-right:1px solid #27272a;padding:8px;display:flex;flex-direction:column">
    <div style="background:#27272a;border-radius:6px;padding:5px 6px;margin-bottom:8px;display:flex;align-items:center;gap:4px">
      <div style="width:16px;height:16px;background:#4f46e5;border-radius:4px"></div>
      <span style="font-size:9px;color:#fafafa">Workspace</span>
    </div>
    <div style="font-size:9px;color:#71717a;display:flex;flex-direction:column;gap:2px">
      <span style="background:#27272a;padding:3px 6px;border-radius:4px;color:#fafafa">Home</span>
      <span style="padding:3px 6px">Projects</span><span style="padding:3px 6px">Team</span>
    </div>
  </div>
  <div style="flex:1;padding:12px">
    <div style="font-weight:700;color:#fafafa;margin-bottom:10px">Home</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:8px"><div style="font-size:10px;font-weight:600;color:#fafafa">Alpha</div><div style="font-size:9px;color:#71717a">Main product</div></div>
      <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:8px"><div style="font-size:10px;font-weight:600;color:#fafafa">Beta</div><div style="font-size:9px;color:#71717a">Experimental</div></div>
    </div>
  </div>
</div>`,
};

const blogTemplate: LayoutTemplate = {
  type: "blog",
  name: "Blog",
  description: "Content-focused blog with article list and reading view.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts, ideas, and more.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen\`}>
        <header className="border-b border-zinc-800 py-5 px-6">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <a href="/" className="font-bold text-lg text-indigo-400">The Blog</a>
            <nav className="flex gap-5 text-sm text-zinc-400">
              <a href="/articles" className="hover:text-zinc-50">Articles</a>
              <a href="/about" className="hover:text-zinc-50">About</a>
              <a href="/rss" className="hover:text-zinc-50">RSS</a>
            </nav>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-12">{children}</main>
        <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} The Blog
        </footer>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const POSTS = [
  {
    slug: "getting-started",
    title: "Getting Started with Next.js 15",
    excerpt: "A deep dive into the latest features and how to use them effectively.",
    date: "Jan 15, 2025",
    readTime: "5 min read",
  },
  {
    slug: "design-systems",
    title: "Building a Design System from Scratch",
    excerpt: "Learn how to create a cohesive design language for your products.",
    date: "Jan 8, 2025",
    readTime: "8 min read",
  },
  {
    slug: "ai-patterns",
    title: "AI Integration Patterns in 2025",
    excerpt: "Practical patterns for integrating LLMs into your applications.",
    date: "Jan 1, 2025",
    readTime: "6 min read",
  },
];

export default function BlogIndexPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-50 mb-2">Articles</h1>
      <p className="text-zinc-400 mb-10">Thoughts on software, design, and AI.</p>
      <div className="flex flex-col divide-y divide-zinc-800">
        {POSTS.map((post) => (
          <article key={post.slug} className="py-8 group">
            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
              <time>{post.date}</time>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
            <h2 className="text-xl font-semibold text-zinc-50 group-hover:text-indigo-400 transition-colors mb-2 cursor-pointer">
              {post.title}
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-3">{post.excerpt}</p>
            <a href={\`/\${post.slug}\`} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
              Read more →
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
`,
    },
  ],
  previewHtml: `<div style="background:#09090b;font-family:sans-serif;height:100%">
  <div style="border-bottom:1px solid #27272a;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#818cf8;font-weight:700">The Blog</span>
    <span style="font-size:10px;color:#71717a">Articles · About · RSS</span>
  </div>
  <div style="max-width:360px;margin:0 auto;padding:16px 12px">
    <div style="font-weight:700;color:#fafafa;font-size:16px;margin-bottom:4px">Articles</div>
    <div style="font-size:10px;color:#71717a;margin-bottom:12px">Thoughts on software and design.</div>
    <div style="border-top:1px solid #27272a;padding-top:10px;margin-bottom:8px">
      <div style="font-size:9px;color:#52525b;margin-bottom:3px">Jan 15, 2025 · 5 min read</div>
      <div style="font-size:12px;font-weight:600;color:#fafafa;margin-bottom:3px">Getting Started with Next.js 15</div>
      <div style="font-size:9px;color:#71717a">A deep dive into the latest features…</div>
      <div style="font-size:9px;color:#818cf8;margin-top:5px">Read more →</div>
    </div>
  </div>
</div>`,
};

const portfolioTemplate: LayoutTemplate = {
  type: "portfolio",
  name: "Portfolio",
  description: "Personal portfolio showcasing projects, skills, and contact.",
  files: [
    {
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jane Doe — Designer & Developer",
  description: "Personal portfolio of Jane Doe.",
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={\`\${inter.className} bg-zinc-950 text-zinc-50 min-h-screen\`}>
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-zinc-50">Jane Doe</a>
            <nav className="flex gap-6 text-sm text-zinc-400">
              <a href="#work" className="hover:text-zinc-50">Work</a>
              <a href="#about" className="hover:text-zinc-50">About</a>
              <a href="#contact" className="hover:text-zinc-50">Contact</a>
            </nav>
          </div>
        </header>
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
`,
    },
    {
      path: "app/page.tsx",
      content: `const PROJECTS = [
  { id: 1, title: "Project Alpha", tags: ["React", "TypeScript"], year: "2024" },
  { id: 2, title: "Project Beta", tags: ["Next.js", "Tailwind"], year: "2024" },
  { id: 3, title: "Project Gamma", tags: ["Node.js", "Postgres"], year: "2023" },
  { id: 4, title: "Project Delta", tags: ["Python", "ML"], year: "2023" },
];

export default function PortfolioPage() {
  return (
    <>
      {/* Hero */}
      <section className="min-h-[70vh] flex items-center max-w-4xl mx-auto px-6">
        <div>
          <p className="text-indigo-400 font-medium mb-3">Hello, I&apos;m</p>
          <h1 className="text-5xl md:text-7xl font-bold text-zinc-50 leading-tight mb-5">
            Jane Doe
          </h1>
          <p className="text-xl text-zinc-400 max-w-lg mb-8">
            Designer &amp; developer crafting thoughtful digital experiences.
          </p>
          <div className="flex gap-4">
            <a href="#work" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">View work</a>
            <a href="#contact" className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-50 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">Get in touch</a>
          </div>
        </div>
      </section>

      {/* Work */}
      <section id="work" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-zinc-50 mb-8">Selected Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PROJECTS.map((p) => (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-indigo-700 transition-colors cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-indigo-900/40 to-zinc-800 flex items-center justify-center">
                <span className="text-2xl font-bold text-zinc-600">{p.title[0]}</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-zinc-50 group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                  <span className="text-xs text-zinc-500">{p.year}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {p.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
`,
    },
  ],
  previewHtml: `<div style="background:#09090b;font-family:sans-serif;height:100%">
  <div style="background:rgba(9,9,11,0.8);border-bottom:1px solid #27272a;padding:8px 12px;display:flex;justify-content:space-between;align-items:center">
    <span style="color:#fafafa;font-weight:700">Jane Doe</span>
    <span style="font-size:10px;color:#71717a">Work · About · Contact</span>
  </div>
  <div style="padding:20px 12px">
    <div style="font-size:9px;color:#818cf8;margin-bottom:4px">Hello, I'm</div>
    <div style="font-size:22px;font-weight:700;color:#fafafa;margin-bottom:6px">Jane Doe</div>
    <div style="font-size:10px;color:#71717a;margin-bottom:10px">Designer & developer.</div>
    <div style="display:flex;gap:6px">
      <div style="background:#4f46e5;color:#fff;font-size:9px;padding:4px 8px;border-radius:6px">View work</div>
      <div style="border:1px solid #3f3f46;color:#a1a1aa;font-size:9px;padding:4px 8px;border-radius:6px">Contact</div>
    </div>
  </div>
</div>`,
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const LAYOUT_TEMPLATES: Record<LayoutType, LayoutTemplate> = {
  dashboard: dashboardTemplate,
  auth: authTemplate,
  ecommerce: ecommerceTemplate,
  admin: adminTemplate,
  landing: landingTemplate,
  saas: saasTemplate,
  blog: blogTemplate,
  portfolio: portfolioTemplate,
};

export function getTemplate(type: LayoutType): LayoutTemplate {
  return LAYOUT_TEMPLATES[type];
}
