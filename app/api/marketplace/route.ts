import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface MarketplaceComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  previewHtml: string;
  code: string;
  downloads: number;
}

const COMPONENTS: MarketplaceComponent[] = [
  {
    id: "hero-section",
    name: "Hero Section",
    category: "Landing Pages",
    description: "A bold hero section with headline, subtext, and CTA buttons.",
    tags: ["hero", "landing"],
    previewHtml: `<section class="bg-white py-20 text-center"><h1 class="text-4xl font-bold">Welcome to ZIVO</h1><p class="mt-4 text-gray-500">Build faster with AI.</p><a href="#" class="mt-8 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl">Get Started</a></section>`,
    code: `export function HeroSection() {\n  return (\n    <section className="bg-white py-20 text-center">\n      <h1 className="text-4xl font-bold">Welcome to ZIVO</h1>\n      <p className="mt-4 text-gray-500">Build faster with AI.</p>\n      <a href="#" className="mt-8 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl">Get Started</a>\n    </section>\n  );\n}`,
    downloads: 4821,
  },
  {
    id: "pricing-table",
    name: "Pricing Table",
    category: "SaaS",
    description: "Three-tier pricing cards for SaaS products with feature lists.",
    tags: ["pricing", "saas"],
    previewHtml: `<div class="flex gap-4 justify-center py-10"><div class="border rounded-xl p-6 w-48 text-center"><h2 class="font-bold">Starter</h2><p class="text-2xl font-bold mt-2">$9<span class="text-sm">/mo</span></p></div><div class="border rounded-xl p-6 w-48 text-center bg-blue-600 text-white"><h2 class="font-bold">Pro</h2><p class="text-2xl font-bold mt-2">$29<span class="text-sm">/mo</span></p></div><div class="border rounded-xl p-6 w-48 text-center"><h2 class="font-bold">Enterprise</h2><p class="text-2xl font-bold mt-2">$99<span class="text-sm">/mo</span></p></div></div>`,
    code: `const plans = [\n  { name: "Starter", price: "$9" },\n  { name: "Pro", price: "$29", highlighted: true },\n  { name: "Enterprise", price: "$99" },\n];\n\nexport function PricingTable() {\n  return (\n    <div className="flex gap-4 justify-center py-10">\n      {plans.map((p) => (\n        <div key={p.name} className={\`border rounded-xl p-6 w-48 text-center \${p.highlighted ? "bg-blue-600 text-white" : ""}\`}>\n          <h2 className="font-bold">{p.name}</h2>\n          <p className="text-2xl font-bold mt-2">{p.price}<span className="text-sm">/mo</span></p>\n        </div>\n      ))}\n    </div>\n  );\n}`,
    downloads: 3410,
  },
  {
    id: "stats-cards",
    name: "Stats Cards Dashboard",
    category: "Dashboards",
    description: "A row of metric cards for dashboards showing key statistics.",
    tags: ["stats", "dashboard"],
    previewHtml: `<div class="grid grid-cols-3 gap-4 p-6"><div class="bg-white rounded-xl p-4 shadow"><p class="text-gray-500 text-sm">Total Users</p><p class="text-3xl font-bold">12,400</p></div><div class="bg-white rounded-xl p-4 shadow"><p class="text-gray-500 text-sm">Revenue</p><p class="text-3xl font-bold">$84K</p></div><div class="bg-white rounded-xl p-4 shadow"><p class="text-gray-500 text-sm">Uptime</p><p class="text-3xl font-bold">99.9%</p></div></div>`,
    code: `const stats = [\n  { label: "Total Users", value: "12,400" },\n  { label: "Revenue", value: "$84K" },\n  { label: "Uptime", value: "99.9%" },\n];\n\nexport function StatsCards() {\n  return (\n    <div className="grid grid-cols-3 gap-4 p-6">\n      {stats.map((s) => (\n        <div key={s.label} className="bg-white rounded-xl p-4 shadow">\n          <p className="text-gray-500 text-sm">{s.label}</p>\n          <p className="text-3xl font-bold">{s.value}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`,
    downloads: 2980,
  },
  {
    id: "product-grid",
    name: "Product Grid",
    category: "E-commerce",
    description: "Responsive product card grid for e-commerce storefronts.",
    tags: ["products", "grid"],
    previewHtml: `<div class="grid grid-cols-3 gap-6 p-6"><div class="border rounded-xl overflow-hidden"><div class="bg-gray-100 h-32"></div><div class="p-3"><p class="font-semibold">Product Name</p><p class="text-blue-600 font-bold mt-1">$49.99</p></div></div></div>`,
    code: `interface Product { id: string; name: string; price: string; }\n\nexport function ProductGrid({ products }: { products: Product[] }) {\n  return (\n    <div className="grid grid-cols-3 gap-6 p-6">\n      {products.map((p) => (\n        <div key={p.id} className="border rounded-xl overflow-hidden">\n          <div className="bg-gray-100 h-32" />\n          <div className="p-3">\n            <p className="font-semibold">{p.name}</p>\n            <p className="text-blue-600 font-bold mt-1">{p.price}</p>\n          </div>\n        </div>\n      ))}\n    </div>\n  );\n}`,
    downloads: 2150,
  },
  {
    id: "testimonials-carousel",
    name: "Testimonials Carousel",
    category: "Landing Pages",
    description: "Customer testimonial cards with avatar, quote, and name.",
    tags: ["testimonials"],
    previewHtml: `<div class="flex gap-6 overflow-x-auto px-6 py-10"><div class="min-w-64 border rounded-xl p-6 shadow"><p class="text-gray-600 italic">"ZIVO changed how we build products."</p><p class="mt-4 font-bold">— Jane Doe</p></div></div>`,
    code: `const testimonials = [\n  { id: "1", quote: "ZIVO changed how we build products.", author: "Jane Doe" },\n  { id: "2", quote: "Incredible AI tooling out of the box.", author: "John Smith" },\n];\n\nexport function TestimonialsCarousel() {\n  return (\n    <div className="flex gap-6 overflow-x-auto px-6 py-10">\n      {testimonials.map((t) => (\n        <div key={t.id} className="min-w-64 border rounded-xl p-6 shadow">\n          <p className="text-gray-600 italic">"{t.quote}"</p>\n          <p className="mt-4 font-bold">— {t.author}</p>\n        </div>\n      ))}\n    </div>\n  );\n}`,
    downloads: 1890,
  },
  {
    id: "auth-form",
    name: "Auth Form",
    category: "Authentication",
    description: "Sign in / sign up form with email and password fields.",
    tags: ["auth", "form"],
    previewHtml: `<div class="max-w-sm mx-auto mt-16 p-8 border rounded-xl shadow"><h2 class="text-2xl font-bold mb-6">Sign In</h2><input class="w-full border rounded-lg px-4 py-2 mb-4" placeholder="Email"/><input class="w-full border rounded-lg px-4 py-2 mb-6" type="password" placeholder="Password"/><button class="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold">Sign In</button></div>`,
    code: `"use client";\nimport { useState } from "react";\n\nexport function AuthForm() {\n  const [email, setEmail] = useState("");\n  const [password, setPassword] = useState("");\n  return (\n    <div className="max-w-sm mx-auto mt-16 p-8 border rounded-xl shadow">\n      <h2 className="text-2xl font-bold mb-6">Sign In</h2>\n      <input className="w-full border rounded-lg px-4 py-2 mb-4" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />\n      <input className="w-full border rounded-lg px-4 py-2 mb-6" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />\n      <button className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold">Sign In</button>\n    </div>\n  );\n}`,
    downloads: 5230,
  },
];

function filterComponents(
  components: MarketplaceComponent[],
  category?: string,
  search?: string
): MarketplaceComponent[] {
  return components.filter((c) => {
    const matchesCategory = !category || c.category.toLowerCase() === category.toLowerCase();
    const term = search?.toLowerCase() ?? "";
    const matchesSearch =
      !term ||
      c.name.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      c.tags.some((t) => t.includes(term));
    return matchesCategory && matchesSearch;
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const components = filterComponents(COMPONENTS, category, search);
  return NextResponse.json({ components });
}

export async function POST(req: Request) {
  const body: { category?: string; search?: string } = await req.json().catch(() => ({}));
  const components = filterComponents(COMPONENTS, body.category, body.search);
  return NextResponse.json({ components });
}
