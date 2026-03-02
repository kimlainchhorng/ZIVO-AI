import { NextResponse } from "next/server";
import type { Integration, IntegrationCategory } from "@/lib/services-types";

export const runtime = "nodejs";

const integrations: Integration[] = [
  // Payment
  { id: "stripe", name: "Stripe", category: "payment", description: "Full-stack payments, subscriptions, and payouts", isConnected: true, docsUrl: "https://stripe.com/docs" },
  { id: "paypal", name: "PayPal", category: "payment", description: "Global payment processing and digital wallets", isConnected: false, docsUrl: "https://developer.paypal.com" },
  { id: "braintree", name: "Braintree", category: "payment", description: "PayPal-owned gateway supporting all major payment methods", isConnected: false, docsUrl: "https://developer.paypal.com/braintree/docs" },
  { id: "square", name: "Square", category: "payment", description: "Point-of-sale and online payment solutions", isConnected: false },
  { id: "adyen", name: "Adyen", category: "payment", description: "Enterprise payment platform for global transactions", isConnected: true },

  // Mapping
  { id: "google-maps", name: "Google Maps Platform", category: "mapping", description: "Maps, routing, geocoding, and place search", isConnected: true, docsUrl: "https://developers.google.com/maps" },
  { id: "mapbox", name: "Mapbox", category: "mapping", description: "Custom maps, navigation, and location data", isConnected: true, docsUrl: "https://docs.mapbox.com" },
  { id: "here", name: "HERE Maps", category: "mapping", description: "Location services and routing for enterprises", isConnected: false },
  { id: "openstreetmap", name: "OpenStreetMap", category: "mapping", description: "Open-source map data and rendering", isConnected: false },

  // Communication
  { id: "twilio", name: "Twilio", category: "communication", description: "SMS, voice, WhatsApp, and email messaging", isConnected: true, docsUrl: "https://www.twilio.com/docs" },
  { id: "sendgrid", name: "SendGrid", category: "communication", description: "Transactional and marketing email delivery", isConnected: true },
  { id: "firebase-fcm", name: "Firebase FCM", category: "communication", description: "Push notifications for iOS and Android", isConnected: true },
  { id: "intercom", name: "Intercom", category: "communication", description: "Customer messaging and support platform", isConnected: false },

  // Analytics
  { id: "segment", name: "Segment", category: "analytics", description: "Customer data platform and event tracking", isConnected: true, docsUrl: "https://segment.com/docs" },
  { id: "mixpanel", name: "Mixpanel", category: "analytics", description: "Product analytics and user behavior tracking", isConnected: false },
  { id: "amplitude", name: "Amplitude", category: "analytics", description: "Digital analytics and experimentation platform", isConnected: false },
  { id: "datadog", name: "Datadog", category: "analytics", description: "Infrastructure monitoring and APM", isConnected: true },

  // Cloud
  { id: "aws", name: "Amazon Web Services", category: "cloud", description: "Compute, storage, and cloud services", isConnected: true, docsUrl: "https://docs.aws.amazon.com" },
  { id: "gcp", name: "Google Cloud Platform", category: "cloud", description: "Google's cloud infrastructure and AI services", isConnected: false },
  { id: "azure", name: "Microsoft Azure", category: "cloud", description: "Microsoft's cloud computing platform", isConnected: false },
  { id: "cloudflare", name: "Cloudflare", category: "cloud", description: "CDN, DDoS protection, and edge computing", isConnected: true },

  // Database
  { id: "postgres", name: "PostgreSQL", category: "database", description: "Open-source relational database", isConnected: true },
  { id: "mongodb", name: "MongoDB Atlas", category: "database", description: "Cloud-hosted NoSQL database service", isConnected: true },
  { id: "redis", name: "Redis", category: "database", description: "In-memory data store for caching and sessions", isConnected: true },
  { id: "elasticsearch", name: "Elasticsearch", category: "database", description: "Distributed search and analytics engine", isConnected: false },

  // AI/ML
  { id: "openai", name: "OpenAI", category: "ai_ml", description: "GPT-4 and other AI models for smart features", isConnected: true, docsUrl: "https://platform.openai.com/docs" },
  { id: "anthropic", name: "Anthropic Claude", category: "ai_ml", description: "Constitutional AI for safe and reliable assistance", isConnected: false },
  { id: "google-ai", name: "Google AI", category: "ai_ml", description: "Gemini and Vertex AI for machine learning", isConnected: false },
  { id: "huggingface", name: "Hugging Face", category: "ai_ml", description: "Open-source AI models and inference", isConnected: false },

  // Insurance
  { id: "zurich", name: "Zurich Insurance", category: "insurance", description: "Commercial insurance for fleet and freight", isConnected: false },
  { id: "allianz", name: "Allianz", category: "insurance", description: "Travel and package insurance integration", isConnected: false },
  { id: "axa", name: "AXA", category: "insurance", description: "Global insurance and assistance services", isConnected: false },

  // Identity
  { id: "stripe-identity", name: "Stripe Identity", category: "identity", description: "Document and biometric ID verification", isConnected: true },
  { id: "jumio", name: "Jumio", category: "identity", description: "AI-powered identity verification platform", isConnected: false },
  { id: "persona", name: "Persona", category: "identity", description: "Configurable identity verification workflows", isConnected: false },

  // Logistics APIs
  { id: "easypost", name: "EasyPost", category: "logistics_api", description: "Multi-carrier shipping API", isConnected: true, docsUrl: "https://www.easypost.com/docs" },
  { id: "shipstation", name: "ShipStation", category: "logistics_api", description: "Order fulfillment and shipping automation", isConnected: false },
  { id: "fedex-api", name: "FedEx API", category: "logistics_api", description: "FedEx shipping, tracking, and rates", isConnected: true },
  { id: "ups-api", name: "UPS API", category: "logistics_api", description: "UPS shipping and logistics services", isConnected: false },
  { id: "usps", name: "USPS Web Tools", category: "logistics_api", description: "USPS domestic shipping and tracking", isConnected: false },
  { id: "dhl-api", name: "DHL API", category: "logistics_api", description: "DHL international shipping and express delivery", isConnected: false },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as IntegrationCategory | null;

  const filtered = category ? integrations.filter((i) => i.category === category) : integrations;

  const summary = {
    total: integrations.length,
    connected: integrations.filter((i) => i.isConnected).length,
    byCategory: Object.fromEntries(
      (["payment", "mapping", "communication", "analytics", "cloud", "database", "ai_ml", "insurance", "identity", "logistics_api"] as IntegrationCategory[]).map(
        (cat) => [cat, integrations.filter((i) => i.category === cat).length]
      )
    ),
  };

  return NextResponse.json({ integrations: filtered, summary });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { integrationId, action } = body;

    if (!integrationId || !action) {
      return NextResponse.json({ error: "integrationId and action are required" }, { status: 400 });
    }

    if (!["connect", "disconnect", "test"].includes(action)) {
      return NextResponse.json({ error: "action must be connect, disconnect, or test" }, { status: 400 });
    }

    return NextResponse.json({
      integrationId,
      action,
      success: true,
      message: `Integration ${integrationId} ${action}ed successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
