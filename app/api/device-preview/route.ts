import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEVICE_CONFIGS = [
  { device: "iphone-se", label: "iPhone SE", width: 375, height: 667, dpr: 2 },
  { device: "iphone-15", label: "iPhone 15", width: 390, height: 844, dpr: 3 },
  { device: "iphone-15-pro-max", label: "iPhone 15 Pro Max", width: 430, height: 932, dpr: 3 },
  { device: "samsung-s24", label: "Samsung Galaxy S24", width: 360, height: 780, dpr: 3 },
  { device: "pixel-8", label: "Google Pixel 8", width: 412, height: 915, dpr: 2.625 },
  { device: "ipad-mini", label: "iPad Mini", width: 744, height: 1024, dpr: 2 },
  { device: "ipad-pro", label: "iPad Pro 12.9\"", width: 1024, height: 1366, dpr: 2 },
  { device: "macbook-air", label: "MacBook Air 13\"", width: 1280, height: 800, dpr: 2 },
  { device: "macbook-pro-16", label: "MacBook Pro 16\"", width: 1728, height: 1117, dpr: 2 },
  { device: "desktop-1080p", label: "Desktop 1080p", width: 1920, height: 1080, dpr: 1 },
];

export async function GET() {
  return NextResponse.json({ description: "Device viewport configuration API", devices: DEVICE_CONFIGS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const deviceId = body.device as string | undefined;

    if (!deviceId) {
      return NextResponse.json({ devices: DEVICE_CONFIGS });
    }

    const config = DEVICE_CONFIGS.find((d) => d.device === deviceId);
    if (!config) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json({ config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
