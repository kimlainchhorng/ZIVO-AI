import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  quality: 1 | 2 | 3 | 4 | 5;
}

const MODELS: ModelInfo[] = [
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    description: "Fast and efficient — ideal for quick prototypes and simple apps.",
    speed: "fast",
    quality: 3,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most powerful — best for complex, production-ready applications.",
    speed: "slow",
    quality: 5,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Balanced — great quality at a faster speed than GPT-4o.",
    speed: "medium",
    quality: 4,
  },
];

export async function GET() {
  return NextResponse.json({ models: MODELS });
}
