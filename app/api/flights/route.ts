import { NextResponse } from "next/server";
import type { FlightSearch, Flight, CabinClass } from "@/lib/services-types";

export const runtime = "nodejs";

const airlines = ["United Airlines", "Delta Air Lines", "American Airlines", "Southwest", "JetBlue"];

function generateFlight(search: FlightSearch, index: number): Flight {
  const stops = index % 3 === 2 ? 1 : 0;
  const duration = stops > 0 ? 360 + Math.floor(Math.random() * 120) : 300 + Math.floor(Math.random() * 60);
  const basePrice = search.cabinClass === "first" ? 1200 : search.cabinClass === "business" ? 650 : search.cabinClass === "premium_economy" ? 380 : 180 + Math.floor(Math.random() * 200);
  const departureHour = 6 + index * 3;
  const departureDate = new Date(`${search.departureDate}T${String(departureHour).padStart(2, "0")}:00:00Z`);
  const arrivalDate = new Date(departureDate.getTime() + duration * 60 * 1000);

  return {
    id: `FL-${index + 1}`,
    flightNumber: `${["UA", "DL", "AA", "WN", "B6"][index % 5]} ${100 + index * 111}`,
    airline: airlines[index % airlines.length],
    origin: search.origin,
    destination: search.destination,
    departureTime: departureDate.toISOString(),
    arrivalTime: arrivalDate.toISOString(),
    duration,
    stops,
    price: basePrice + index * 20,
    cabinClass: search.cabinClass,
    seatsAvailable: 5 + Math.floor(Math.random() * 80),
    status: "scheduled",
    amenities: index % 2 === 0 ? ["Wi-Fi", "USB Power", "Meal Service"] : ["USB Power", "Streaming Entertainment"],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Partial<FlightSearch>;
    const { origin, destination, departureDate, passengers = 1, cabinClass = "economy" } = body;

    if (!origin || !destination || !departureDate) {
      return NextResponse.json({ error: "origin, destination, and departureDate are required" }, { status: 400 });
    }

    const search: FlightSearch = { origin, destination, departureDate, passengers, cabinClass: cabinClass as CabinClass };
    const flights: Flight[] = Array.from({ length: 4 }, (_, i) => generateFlight(search, i));

    return NextResponse.json({ flights, total: flights.length, searchParams: search });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pnr = searchParams.get("pnr");
  if (!pnr) {
    return NextResponse.json({ error: "pnr is required" }, { status: 400 });
  }
  return NextResponse.json({
    pnr,
    status: "confirmed",
    flight: { origin: "SFO", destination: "JFK", departureTime: "2026-03-10T08:30:00Z" },
  });
}
