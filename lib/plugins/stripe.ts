import type { PluginFile } from "@/lib/plugins";

export function generateStripeIntegration(config: {
  currency: string;
  successUrl: string;
  cancelUrl: string;
}): PluginFile[] {
  return [
    {
      path: "lib/stripe.ts",
      content: `import Stripe from 'stripe';\nexport const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as const });`,
    },
    {
      path: "app/api/stripe/checkout/route.ts",
      content: `import { NextResponse } from 'next/server';\nimport { stripe } from '@/lib/stripe';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const { priceId } = await req.json().catch(() => ({})) as { priceId?: string };\n  if (!priceId) return NextResponse.json({ error: 'priceId required' }, { status: 400 });\n  const session = await stripe.checkout.sessions.create({ mode: 'payment', payment_method_types: ['card'], line_items: [{ price: priceId, quantity: 1 }], success_url: '${config.successUrl}', cancel_url: '${config.cancelUrl}', currency: '${config.currency}' });\n  return NextResponse.json({ url: session.url });\n}`,
    },
    {
      path: "app/api/stripe/webhook/route.ts",
      content: `import { NextResponse } from 'next/server';\nimport { stripe } from '@/lib/stripe';\nexport const runtime = 'nodejs';\nexport async function POST(req: Request) {\n  const sig = req.headers.get('stripe-signature') ?? '';\n  const body = await req.text();\n  let event;\n  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!); } catch (err) { return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 }); }\n  if (event.type === 'checkout.session.completed') { const session = event.data.object; console.log('Payment completed:', session.id); }\n  return NextResponse.json({ received: true });\n}`,
    },
    {
      path: "components/CheckoutButton.tsx",
      content: `'use client';\nexport default function CheckoutButton({ priceId }: { priceId: string }) {\n  const handleCheckout = async () => {\n    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceId }) });\n    const { url } = await res.json() as { url?: string };\n    if (url) window.location.href = url;\n  };\n  return <button onClick={handleCheckout} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Checkout</button>;\n}`,
    },
  ];
}
