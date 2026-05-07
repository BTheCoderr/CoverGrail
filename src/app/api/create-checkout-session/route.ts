import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Stripe Checkout Sessions not wired yet. Add STRIPE_SECRET_KEY and implement session creation.",
    },
    { status: 501 },
  );
}
