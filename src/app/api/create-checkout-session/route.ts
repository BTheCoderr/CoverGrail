import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

const PLANS = ["single_scan", "collector", "dealer"] as const;
type Plan = (typeof PLANS)[number];

function priceIdForPlan(plan: Plan): string | undefined {
  if (plan === "single_scan") return process.env.STRIPE_PRICE_SINGLE_SCAN;
  if (plan === "collector") return process.env.STRIPE_PRICE_COLLECTOR_MONTHLY;
  return process.env.STRIPE_PRICE_DEALER_MONTHLY;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planRaw =
    body && typeof body === "object" && "plan" in body
      ? (body as { plan?: unknown }).plan
      : undefined;
  const plan = typeof planRaw === "string" ? planRaw : undefined;

  if (!plan || !PLANS.includes(plan as Plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Expected single_scan, collector, or dealer." },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL is not set" }, { status: 503 });
  }

  const priceId = priceIdForPlan(plan as Plan);
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 503 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
      },
      { onConflict: "id" },
    );
  }

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const metadata = { user_id: user.id, plan };

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: plan === "single_scan" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard?checkout=success`,
    cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    metadata,
    ...(plan === "single_scan"
      ? {}
      : {
          subscription_data: {
            metadata,
          },
        }),
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    return NextResponse.json({ error: "Checkout session missing redirect URL" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
