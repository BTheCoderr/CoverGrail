import { NextResponse } from "next/server";

/**
 * Stub webhook endpoint. Before production:
 * - Verify signature with STRIPE_WEBHOOK_SECRET
 * - Upsert rows in `subscriptions` and update `profiles.plan`
 */
export async function POST() {
  return NextResponse.json({
    received: true,
    note: "Implement Stripe webhook signature verification and subscription sync.",
  });
}
