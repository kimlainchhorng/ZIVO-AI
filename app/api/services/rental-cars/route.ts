import { NextResponse } from "next/server";

export const runtime = "nodejs";

const vehicles = [
  { id: "v001", category: "economy", make: "Toyota", model: "Corolla", year: 2024, pricePerDay: 39, seats: 5, available: true },
  { id: "v002", category: "suv", make: "Ford", model: "Explorer", year: 2024, pricePerDay: 79, seats: 7, available: true },
  { id: "v003", category: "luxury", make: "BMW", model: "5 Series", year: 2024, pricePerDay: 129, seats: 5, available: true },
  { id: "v004", category: "midsize", make: "Honda", model: "Accord", year: 2024, pricePerDay: 64, seats: 5, available: true },
  { id: "v005", category: "van", make: "Toyota", model: "Sienna", year: 2023, pricePerDay: 89, seats: 8, available: false },
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { vehicleId, pickupLocation, pickupDate, returnDate, addOns, driverId } = body;

    if (!vehicleId || !pickupLocation || !pickupDate || !returnDate) {
      return NextResponse.json(
        { error: "vehicleId, pickupLocation, pickupDate, and returnDate are required" },
        { status: 400 }
      );
    }

    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }
    if (!vehicle.available) {
      return NextResponse.json({ error: "Vehicle is not available for the requested dates" }, { status: 409 });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const days = Math.max(1, Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)));

    const addOnPrices: Record<string, number> = {
      gps: 9.99,
      child: 11.99,
      prepaid_fuel: 24.99,
      roadside: 14.99,
      extra_driver: 12.99,
      toll: 6.99,
    };

    const addOnCost = (addOns as string[] ?? []).reduce((sum, id) => sum + (addOnPrices[id] ?? 0), 0);
    const rentalCost = vehicle.pricePerDay * days;
    const taxes = Math.round(rentalCost * 0.15 * 100) / 100;
    const total = rentalCost + addOnCost * days + taxes;

    const reservationId = `RES-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      reservationId,
      status: "confirmed",
      vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year, category: vehicle.category },
      pickupLocation,
      pickupDate,
      returnDate,
      days,
      driverId: driverId ?? null,
      addOns: addOns ?? [],
      pricing: {
        rentalCost: rentalCost.toFixed(2),
        addOnCost: (addOnCost * days).toFixed(2),
        taxes: taxes.toFixed(2),
        total: total.toFixed(2),
      },
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const available = vehicles.filter((v) =>
    v.available && (category ? v.category === category : true)
  );

  return NextResponse.json({ vehicles: available, count: available.length });
}
