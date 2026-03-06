export type DetectedFeature =
  | "auth" | "database" | "dashboard" | "api" | "stripe"
  | "realtime" | "storage" | "email" | "saas" | "ecommerce"
  | "blog" | "booking" | "landing" | "portfolio";

export interface FeatureAnalysis {
  features: DetectedFeature[];
  complexity: "simple" | "medium" | "saas" | "enterprise";
  minimumFileCount: number;
  requiredPages: string[];
  requiredApiRoutes: string[];
  requiredComponents: string[];
}

export function detectFeatures(prompt: string): FeatureAnalysis {
  const lower = prompt.toLowerCase();
  const features: DetectedFeature[] = [];

  if (/auth|login|signup|register|session|jwt|oauth|user/.test(lower)) features.push("auth");
  if (/database|db|prisma|supabase|postgres|mysql|schema|model/.test(lower)) features.push("database");
  if (/dashboard|admin|panel|analytics|charts|stats/.test(lower)) features.push("dashboard");
  if (/api|endpoint|crud|rest/.test(lower)) features.push("api");
  if (/stripe|billing|subscription|payment|checkout|pricing/.test(lower)) features.push("stripe");
  if (/saas|software as a service|platform/.test(lower)) features.push("saas");
  if (/shop|store|ecommerce|cart|checkout|product/.test(lower)) features.push("ecommerce");
  if (/blog|post|article|cms/.test(lower)) features.push("blog");
  if (/booking|appointment|calendar|schedule/.test(lower)) features.push("booking");

  let complexity: FeatureAnalysis["complexity"] = "simple";
  let minimumFileCount = 10;

  if (features.length >= 4 || features.includes("saas") || features.includes("ecommerce")) {
    complexity = "enterprise";
    minimumFileCount = 50;
  } else if (features.includes("auth") && features.includes("database")) {
    complexity = "saas";
    minimumFileCount = 30;
  } else if (features.includes("dashboard") || features.includes("auth")) {
    complexity = "medium";
    minimumFileCount = 20;
  }

  const requiredPages: string[] = ["app/page.tsx", "app/layout.tsx", "app/globals.css"];
  const requiredApiRoutes: string[] = [];
  const requiredComponents: string[] = ["components/ui/button.tsx", "components/ui/card.tsx"];

  if (features.includes("auth")) {
    requiredPages.push("app/(auth)/login/page.tsx", "app/(auth)/signup/page.tsx");
  }
  if (features.includes("dashboard")) {
    requiredPages.push("app/(dashboard)/dashboard/page.tsx", "app/(dashboard)/layout.tsx");
  }
  if (features.includes("stripe")) {
    requiredPages.push("app/pricing/page.tsx");
    requiredApiRoutes.push("app/api/stripe/checkout/route.ts", "app/api/stripe/webhook/route.ts");
  }

  return { features, complexity, minimumFileCount, requiredPages, requiredApiRoutes, requiredComponents };
}
