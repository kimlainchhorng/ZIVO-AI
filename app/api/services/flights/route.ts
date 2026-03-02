import { NextResponse } from "next/server";

export const runtime = "nodejs";

const mockFlights = [
  { id: "FL001", airline: "Delta", origin: "", destination: "", departure: "08:00", arrival: "11:30", duration: "3h 30m", stops: 0, price: 289, seats: 42 },
  { id: "FL002", airline: "United", origin: "", destination: "", departure: "10:15", arrival: "15:45", duration: "5h 30m", stops: 1, price: 198, seats: 8 },
  { id: "FL003", airline: "American", origin: "", destination: "", departure: "14:30", arrival: "17:50", duration: "3h 20m", stops: 0, price: 312, seats: 23 },
  { id: "FL004", airline: "Southwest", origin: "", destination: "", departure: "18:00", arrival: "21:15", duration: "3h 15m", stops: 0, price: 175, seats: 61 },
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { origin, destination, departDate, returnDate, tripType, passengers, cabinClass } = body;

    if (!origin || !destination || !departDate) {
      return NextResponse.json({ error: "origin, destination, and departDate are required" }, { status: 400 });
    }

    const flights = mockFlights.map((f) => ({
      ...f,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      date: departDate,
      price: Math.round(f.price * (1 + (Math.random() - 0.5) * 0.3)),
    }));

    return NextResponse.json({
      searchId: `SRCH-${Date.now()}`,
      origin,
      destination,
      departDate,
      returnDate: returnDate ?? null,
      tripType: tripType ?? "one-way",
      passengers: passengers ?? 1,
      cabinClass: cabinClass ?? "economy",
      results: flights,
      count: flights.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
