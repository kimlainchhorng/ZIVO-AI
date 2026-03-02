import { NextResponse } from "next/server";
import { FEATURES, getFeaturesByCategory, getAllCategories } from "@/lib/features";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const idParam = searchParams.get("id");

  if (idParam) {
    const id = parseInt(idParam, 10);
    const feature = FEATURES.find((f) => f.id === id);
    if (!feature) {
      return NextResponse.json({ error: "Feature not found" }, { status: 404 });
    }
    return NextResponse.json({ feature });
  }

  if (category) {
    const features = getFeaturesByCategory(category);
    return NextResponse.json({ features });
  }

  return NextResponse.json({
    features: FEATURES,
    categories: getAllCategories(),
    total: FEATURES.length,
  });
}
