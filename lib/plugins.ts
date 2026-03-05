// lib/plugins.ts — Plugin Registry

export interface PluginFile {
  path: string;
  content: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  version: string;
  installed: boolean;
  config?: Record<string, string>;
  setupInstructions: string;
  envVarsNeeded: string[];
  generatedFiles: PluginFile[];
}

export const PLUGIN_REGISTRY: Plugin[] = [
  {
    id: "stripe",
    name: "Stripe Payments",
    description: "Accept payments, manage subscriptions, and handle billing with Stripe.",
    category: "Payments",
    icon: "💳",
    tags: ["payments", "billing", "subscriptions"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env\n2. Run the generated migration\n3. Import the Checkout component",
    envVarsNeeded: ["STRIPE_SECRET_KEY=sk_test_...", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..."],
    generatedFiles: [
      {
        path: "lib/stripe.ts",
        content: `import Stripe from 'stripe';\nexport const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });`,
      },
      {
        path: "app/api/stripe/checkout/route.ts",
        content: `import { NextResponse } from 'next/server';\nimport { stripe } from '@/lib/stripe';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { priceId } = await req.json().catch(() => ({})) as { priceId?: string };\n  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 });\n  const session = await stripe.checkout.sessions.create({ mode: 'subscription', payment_method_types: ['card'], line_items: [{ price: priceId, quantity: 1 }], success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/success\`, cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/cancel\` });\n  return NextResponse.json({ url: session.url });\n}`,
      },
      {
        path: "components/CheckoutButton.tsx",
        content: `'use client';\nexport default function CheckoutButton({ priceId }: { priceId: string }) {\n  const handleCheckout = async () => {\n    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceId }) });\n    const { url } = await res.json();\n    if (url) window.location.href = url;\n  };\n  return <button onClick={handleCheckout} className="px-4 py-2 bg-indigo-600 text-white rounded">Subscribe</button>;\n}`,
      },
    ],
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Embed interactive maps, geocoding, and location services.",
    category: "Maps",
    icon: "🗺️",
    tags: ["maps", "location", "geocoding"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Enable Maps JavaScript API in Google Cloud Console\n2. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env\n3. Import the MapView component",
    envVarsNeeded: ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key"],
    generatedFiles: [
      {
        path: "components/MapView.tsx",
        content: `'use client';\nimport { useEffect, useRef } from 'react';\nexport default function MapView({ lat = 37.7749, lng = -122.4194 }: { lat?: number; lng?: number }) {\n  const ref = useRef<HTMLDivElement>(null);\n  useEffect(() => {\n    if (!ref.current) return;\n    const script = document.createElement('script');\n    script.src = \`https://maps.googleapis.com/maps/api/js?key=\${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}\`;\n    script.onload = () => {\n      new (window as unknown as { google: { maps: { Map: new (el: HTMLElement, opts: unknown) => void } } }).google.maps.Map(ref.current!, { center: { lat, lng }, zoom: 12 });\n    };\n    document.head.appendChild(script);\n  }, [lat, lng]);\n  return <div ref={ref} style={{ width: '100%', height: '400px' }} />;\n}`,
      },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid Email",
    description: "Send transactional emails and manage email templates with SendGrid.",
    category: "Communication",
    icon: "📧",
    tags: ["email", "notifications", "sendgrid"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Create a SendGrid account and verify your sender\n2. Add SENDGRID_API_KEY to .env\n3. Use the sendEmail helper in your API routes",
    envVarsNeeded: ["SENDGRID_API_KEY=SG...", "SENDGRID_FROM_EMAIL=noreply@yourapp.com"],
    generatedFiles: [
      {
        path: "lib/email.ts",
        content: `export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {\n  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {\n    method: 'POST',\n    headers: { 'Authorization': \`Bearer \${process.env.SENDGRID_API_KEY}\`, 'Content-Type': 'application/json' },\n    body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: process.env.SENDGRID_FROM_EMAIL }, subject, content: [{ type: 'text/html', value: html }] }),\n  });\n  if (!res.ok) throw new Error('Failed to send email');\n}`,
      },
      {
        path: "app/api/email/route.ts",
        content: `import { NextResponse } from 'next/server';\nimport { sendEmail } from '@/lib/email';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { to, subject, html } = await req.json().catch(() => ({})) as { to?: string; subject?: string; html?: string };\n  if (!to || !subject || !html) return NextResponse.json({ error: 'to, subject, html required' }, { status: 400 });\n  await sendEmail({ to, subject, html });\n  return NextResponse.json({ success: true });\n}`,
      },
    ],
  },
  {
    id: "openai-chat",
    name: "OpenAI Chat",
    description: "Add a GPT-4o powered chat widget to your app.",
    category: "AI",
    icon: "🤖",
    tags: ["ai", "chat", "gpt"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Add OPENAI_API_KEY to .env\n2. Import ChatWidget into your layout or page",
    envVarsNeeded: ["OPENAI_API_KEY=sk-..."],
    generatedFiles: [
      {
        path: "app/api/chat/route.ts",
        content: `import { NextResponse } from 'next/server';\nimport OpenAI from 'openai';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { messages } = await req.json().catch(() => ({})) as { messages?: { role: string; content: string }[] };\n  if (!messages) return NextResponse.json({ error: 'messages required' }, { status: 400 });\n  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });\n  const response = await client.chat.completions.create({ model: 'gpt-4o', messages: messages as OpenAI.Chat.ChatCompletionMessageParam[] });\n  return NextResponse.json({ message: response.choices[0]?.message?.content });\n}`,
      },
      {
        path: "components/ChatWidget.tsx",
        content: `'use client';\nimport { useState } from 'react';\nexport default function ChatWidget() {\n  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);\n  const [input, setInput] = useState('');\n  const send = async () => {\n    if (!input.trim()) return;\n    const newMessages = [...messages, { role: 'user', content: input }];\n    setMessages(newMessages);\n    setInput('');\n    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages }) });\n    const { message } = await res.json();\n    setMessages([...newMessages, { role: 'assistant', content: message }]);\n  };\n  return (<div style={{ position: 'fixed', bottom: 20, right: 20, width: 320, background: '#0f1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, zIndex: 1000 }}><div style={{ height: 200, overflowY: 'auto', marginBottom: 8 }}>{messages.map((m, i) => <div key={i} style={{ color: m.role === 'user' ? '#6366f1' : '#f1f5f9', fontSize: 13, marginBottom: 4 }}><b>{m.role}:</b> {m.content}</div>)}</div><div style={{ display: 'flex', gap: 8 }}><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', color: '#f1f5f9', fontSize: 13 }} placeholder="Ask anything..." /><button onClick={send} style={{ background: '#6366f1', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', cursor: 'pointer' }}>Send</button></div></div>);\n}`,
      },
    ],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track page views, events, and user behavior with Google Analytics.",
    category: "Analytics",
    icon: "📊",
    tags: ["analytics", "tracking", "google"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Create a GA4 property in Google Analytics\n2. Add NEXT_PUBLIC_GA_MEASUREMENT_ID to .env\n3. Add <Analytics /> to your root layout",
    envVarsNeeded: ["NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX"],
    generatedFiles: [
      {
        path: "components/Analytics.tsx",
        content: `'use client';\nimport Script from 'next/script';\nexport default function Analytics() {\n  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;\n  if (!id) return null;\n  return (<><Script src={\`https://www.googletagmanager.com/gtag/js?id=\${id}\`} strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive">{{\`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','\${id}');\`}}</Script></>);\n}`,
      },
      {
        path: "lib/analytics.ts",
        content: `export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {\n  if (typeof window !== 'undefined' && (window as unknown as { gtag: (...args: unknown[]) => void }).gtag) {\n    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', name, params);\n  }\n}`,
      },
    ],
  },
  {
    id: "firebase",
    name: "Firebase",
    description: "Authentication, Firestore database, and storage with Firebase.",
    category: "Storage",
    icon: "🔥",
    tags: ["firebase", "auth", "database", "storage"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Create a Firebase project\n2. Add Firebase config env vars to .env\n3. Import firebase from lib/firebase.ts",
    envVarsNeeded: [
      "NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app.firebaseapp.com",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id",
      "NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id",
    ],
    generatedFiles: [
      {
        path: "lib/firebase.ts",
        content: `import { initializeApp, getApps } from 'firebase/app';\nimport { getFirestore } from 'firebase/firestore';\nimport { getAuth } from 'firebase/auth';\nconst firebaseConfig = { apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID };\nconst app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);\nexport const db = getFirestore(app);\nexport const auth = getAuth(app);`,
      },
    ],
  },
  {
    id: "pusher",
    name: "Pusher Real-time",
    description: "Add real-time WebSocket features with Pusher Channels.",
    category: "Communication",
    icon: "📡",
    tags: ["realtime", "websocket", "pusher"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Create a Pusher account and create an app\n2. Add Pusher env vars to .env\n3. Use the pusher client to subscribe to channels",
    envVarsNeeded: [
      "PUSHER_APP_ID=your-app-id",
      "PUSHER_KEY=your-key",
      "PUSHER_SECRET=your-secret",
      "PUSHER_CLUSTER=us2",
      "NEXT_PUBLIC_PUSHER_KEY=your-key",
      "NEXT_PUBLIC_PUSHER_CLUSTER=us2",
    ],
    generatedFiles: [
      {
        path: "lib/pusher.ts",
        content: `import Pusher from 'pusher';\nimport PusherJs from 'pusher-js';\nexport const pusherServer = new Pusher({ appId: process.env.PUSHER_APP_ID!, key: process.env.PUSHER_KEY!, secret: process.env.PUSHER_SECRET!, cluster: process.env.PUSHER_CLUSTER!, useTLS: true });\nexport const pusherClient = new PusherJs(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });`,
      },
      {
        path: "app/api/pusher/trigger/route.ts",
        content: `import { NextResponse } from 'next/server';\nimport { pusherServer } from '@/lib/pusher';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { channel, event, data } = await req.json().catch(() => ({})) as { channel?: string; event?: string; data?: unknown };\n  if (!channel || !event) return NextResponse.json({ error: 'channel and event required' }, { status: 400 });\n  await pusherServer.trigger(channel, event, data);\n  return NextResponse.json({ success: true });\n}`,
      },
    ],
  },
  {
    id: "cloudinary",
    name: "Cloudinary Media",
    description: "Upload, transform, and deliver images and videos with Cloudinary.",
    category: "Storage",
    icon: "☁️",
    tags: ["media", "images", "upload", "cloudinary"],
    version: "1.0.0",
    installed: false,
    setupInstructions: "1. Create a Cloudinary account\n2. Add CLOUDINARY_* env vars to .env\n3. Use the ImageUpload component in your forms",
    envVarsNeeded: [
      "CLOUDINARY_CLOUD_NAME=your-cloud-name",
      "CLOUDINARY_API_KEY=your-api-key",
      "CLOUDINARY_API_SECRET=your-api-secret",
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name",
    ],
    generatedFiles: [
      {
        path: "app/api/upload/route.ts",
        content: `import { NextResponse } from 'next/server';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const formData = await req.formData();\n  const file = formData.get('file') as Blob | null;\n  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });\n  const data = new FormData();\n  data.append('file', file);\n  data.append('upload_preset', 'ml_default');\n  const res = await fetch(\`https://api.cloudinary.com/v1_1/\${process.env.CLOUDINARY_CLOUD_NAME}/image/upload\`, { method: 'POST', body: data });\n  const result = await res.json();\n  return NextResponse.json({ url: result.secure_url });\n}`,
      },
      {
        path: "components/ImageUpload.tsx",
        content: `'use client';\nimport { useState } from 'react';\nexport default function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {\n  const [uploading, setUploading] = useState(false);\n  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {\n    const file = e.target.files?.[0];\n    if (!file) return;\n    setUploading(true);\n    const fd = new FormData();\n    fd.append('file', file);\n    const res = await fetch('/api/upload', { method: 'POST', body: fd });\n    const { url } = await res.json();\n    onUpload(url);\n    setUploading(false);\n  };\n  return (<label style={{ cursor: 'pointer', display: 'inline-block', padding: '8px 16px', background: '#6366f1', color: '#fff', borderRadius: 6 }}>{uploading ? 'Uploading...' : 'Upload Image'}<input type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} /></label>);\n}`,
      },
    ],
  },
];

// In-memory store for installed plugins
const installedPlugins: Map<string, Record<string, string>> = new Map();

export function installPlugin(
  pluginId: string,
  config: Record<string, string> = {}
): { files: PluginFile[]; instructions: string } {
  const plugin = PLUGIN_REGISTRY.find((p) => p.id === pluginId);
  if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);

  installedPlugins.set(pluginId, config);

  return {
    files: plugin.generatedFiles,
    instructions: plugin.setupInstructions,
  };
}

export function uninstallPlugin(pluginId: string): void {
  installedPlugins.delete(pluginId);
}

export function getInstalledPlugins(): string[] {
  return Array.from(installedPlugins.keys());
}

export function isPluginInstalled(pluginId: string): boolean {
  return installedPlugins.has(pluginId);
}

export function getPluginsWithStatus(): Plugin[] {
  return PLUGIN_REGISTRY.map((p) => ({
    ...p,
    installed: installedPlugins.has(p.id),
    config: installedPlugins.get(p.id),
  }));
}
