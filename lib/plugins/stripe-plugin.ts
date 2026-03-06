// lib/plugins/stripe-plugin.ts — Auto-configures Stripe webhooks and helpers

import type { ZivoPlugin, GeneratedFile } from "./types";

const STRIPE_IMPORT_PATTERN = /stripe|@stripe/i;

function hasStripeCode(files: GeneratedFile[]): boolean {
  return files.some((f) => STRIPE_IMPORT_PATTERN.test(f.content));
}

function generateStripeWebhookHandler(): GeneratedFile {
  return {
    path: "app/api/stripe/webhook/route.ts",
    content: `import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: \`Webhook signature verification failed: \${(err as Error).message}\` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Fulfil the order — update database, send confirmation email, etc.
      console.log("Checkout completed:", session.id);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // TODO: Update subscription status in database
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
`,
    action: "create",
  };
}

export const stripePlugin: ZivoPlugin = {
  name: "stripe-plugin",
  version: "1.0.0",
  description: "Auto-configures Stripe webhook handler when Stripe code is detected",
  hooks: {
    afterGenerate(files) {
      if (!hasStripeCode(files)) return files;

      const alreadyHasWebhook = files.some((f) =>
        f.path.includes("stripe/webhook")
      );
      if (alreadyHasWebhook) return files;

      return [...files, generateStripeWebhookHandler()];
    },
  },
};
