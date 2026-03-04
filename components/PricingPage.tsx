"use client";

import { Check } from "lucide-react";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
}

const DEFAULT_TIERS: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and hobby projects",
    features: ["Up to 3 projects", "Basic AI generation", "Community support"],
    ctaLabel: "Get Started",
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "For professional developers",
    features: [
      "Unlimited projects",
      "Advanced AI models",
      "Priority support",
      "Custom domain",
      "API access",
    ],
    highlighted: true,
    ctaLabel: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
    ctaLabel: "Contact Sales",
  },
];

interface PricingPageProps {
  tiers?: PricingTier[];
  onSelect?: (tier: PricingTier) => void;
}

export default function PricingPage({
  tiers = DEFAULT_TIERS,
  onSelect,
}: PricingPageProps) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 mt-2">
          Choose the plan that works for you
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl p-6 flex flex-col gap-4 border ${
              tier.highlighted
                ? "border-indigo-500 bg-indigo-50 shadow-lg ring-2 ring-indigo-500"
                : "border-gray-200 bg-white"
            }`}
          >
            {tier.highlighted && (
              <span className="self-start text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                Most Popular
              </span>
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {tier.price}
              </p>
              <p className="text-sm text-gray-500 mt-1">{tier.description}</p>
            </div>

            <ul className="space-y-2 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelect?.(tier)}
              className={`mt-auto rounded-xl py-2.5 text-sm font-medium transition-colors ${
                tier.highlighted
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tier.ctaLabel ?? "Get Started"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
