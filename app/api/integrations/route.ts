import { NextResponse } from "next/server";
import {
  INTEGRATIONS,
  getIntegrationsByCategory,
  getAllIntegrationCategories,
  searchIntegrations,
} from "@/lib/integrations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  if (query) {
    const results = searchIntegrations(query);
    return NextResponse.json({ integrations: results, total: results.length });
  }

  if (category) {
    const integrations = getIntegrationsByCategory(category);
    return NextResponse.json({ integrations });
  }

  return NextResponse.json({
    integrations: INTEGRATIONS,
    categories: getAllIntegrationCategories(),
    total: INTEGRATIONS.length,
  });
}
