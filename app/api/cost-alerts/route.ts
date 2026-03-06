import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    description:
      "Cloud cost alert config generator. POST { provider: 'aws'|'gcp'|'azure', budget: number, services: string[] } to receive a cost alert configuration.",
  });
}

type Provider = "aws" | "gcp" | "azure";

interface AlertThreshold {
  percentage: number;
  action: string;
}

interface CostAlertConfig {
  provider: Provider;
  budget: number;
  currency: string;
  thresholds: AlertThreshold[];
  services: Record<string, number>;
  providerConfig: Record<string, unknown>;
}

function buildAwsConfig(budget: number, services: string[]): Record<string, unknown> {
  return {
    type: "AWS Budgets",
    budgetName: "zivo-cost-alert",
    budgetType: "COST",
    budgetLimit: { amount: String(budget), unit: "USD" },
    costFilters: services.length > 0 ? { Service: services } : {},
    notificationsWithSubscribers: [
      {
        notification: { notificationType: "ACTUAL", comparisonOperator: "GREATER_THAN", threshold: 80 },
        subscribers: [{ subscriptionType: "SNS", address: "arn:aws:sns:<region>:<account-id>:cost-alerts" }],
      },
      {
        notification: { notificationType: "FORECASTED", comparisonOperator: "GREATER_THAN", threshold: 100 },
        subscribers: [{ subscriptionType: "SNS", address: "arn:aws:sns:<region>:<account-id>:cost-alerts" }],
      },
    ],
  };
}

function buildGcpConfig(budget: number, services: string[]): Record<string, unknown> {
  return {
    type: "GCP Billing Budget",
    displayName: "zivo-cost-alert",
    budgetFilter: {
      projects: ["projects/<project-id>"],
      services: services.map((s) => `services/${s}`),
    },
    amount: { specifiedAmount: { currencyCode: "USD", units: String(budget) } },
    thresholdRules: [
      { thresholdPercent: 0.5, spendBasis: "CURRENT_SPEND" },
      { thresholdPercent: 0.8, spendBasis: "CURRENT_SPEND" },
      { thresholdPercent: 1.0, spendBasis: "FORECASTED_SPEND" },
    ],
    notificationsRule: { pubsubTopic: "projects/<project-id>/topics/cost-alerts", schemaVersion: "1.0" },
  };
}

function buildAzureConfig(budget: number, services: string[]): Record<string, unknown> {
  return {
    type: "Azure Cost Management Budget",
    name: "zivo-cost-alert",
    properties: {
      category: "Cost",
      amount: budget,
      timeGrain: "Monthly",
      timePeriod: { startDate: new Date().toISOString().slice(0, 10), endDate: "2099-12-31" },
      filter: services.length > 0 ? { dimensions: { name: "ServiceName", operator: "In", values: services } } : {},
      notifications: {
        actual_GreaterThan_80: {
          enabled: true,
          operator: "GreaterThan",
          threshold: 80,
          contactEmails: ["<your-email>"],
          thresholdType: "Actual",
        },
        forecasted_GreaterThan_100: {
          enabled: true,
          operator: "GreaterThan",
          threshold: 100,
          contactEmails: ["<your-email>"],
          thresholdType: "Forecasted",
        },
      },
    },
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const provider = (body.provider as Provider) ?? "aws";
    const budget = typeof body.budget === "number" ? body.budget : 0;
    const services = Array.isArray(body.services) ? (body.services as string[]) : [];

    const thresholds: AlertThreshold[] = [
      { percentage: 50, action: "Notify team via email" },
      { percentage: 80, action: "Page on-call engineer" },
      { percentage: 100, action: "Hard-stop non-critical services" },
    ];

    const serviceAllocations: Record<string, number> = Object.fromEntries(
      services.map((s, i) => [s, Math.round((budget / (services.length || 1)) * (i === 0 ? 0.4 : 0.6 / (services.length - 1 || 1)) * 100) / 100])
    );

    const providerConfigMap: Record<Provider, () => Record<string, unknown>> = {
      aws: () => buildAwsConfig(budget, services),
      gcp: () => buildGcpConfig(budget, services),
      azure: () => buildAzureConfig(budget, services),
    };

    const knownProviders: Provider[] = ["aws", "gcp", "azure"];
    const safeProvider: Provider = knownProviders.includes(provider) ? provider : "aws";

    const config: CostAlertConfig = {
      provider: safeProvider,
      budget,
      currency: "USD",
      thresholds,
      services: serviceAllocations,
      providerConfig: providerConfigMap[safeProvider](),
    };

    return NextResponse.json({ result: config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
