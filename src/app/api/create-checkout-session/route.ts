import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

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
    console.error("[stripe-checkout] Invalid JSON body");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planRaw =
    body && typeof body === "object" && "plan" in body
      ? (body as { plan?: unknown }).plan
      : undefined;
  const plan = typeof planRaw === "string" ? planRaw : undefined;

  if (!plan || !PLANS.includes(plan as Plan)) {
    console.error("[stripe-checkout] Invalid plan:", plan ?? "(missing)");
    return NextResponse.json(
      { error: "Invalid plan. Expected single_scan, collector, or dealer." },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) {
    console.error("[stripe-checkout] NEXT_PUBLIC_SITE_URL is not set");
    return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL is not set" }, { status: 503 });
  }

  const priceId = priceIdForPlan(plan as Plan);
  if (!priceId) {
    const missing =
      plan === "single_scan"
        ? "STRIPE_PRICE_SINGLE_SCAN"
        : plan === "collector"
          ? "STRIPE_PRICE_COLLECTOR_MONTHLY"
          : "STRIPE_PRICE_DEALER_MONTHLY";
    console.error("[stripe-checkout] Missing Stripe price env:", missing);
    return NextResponse.json(
      { error: `Stripe price not configured (${missing})` },
      { status: 503 },
    );
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error("[stripe-checkout]", e instanceof Error ? e.message : "Stripe init failed");
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[stripe-checkout] Unauthenticated checkout attempt");
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
    try {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      const { error: custErr } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (custErr) {
        console.error("[stripe-checkout] Failed to save stripe_customer_id:", custErr.message);
        return NextResponse.json({ error: "Could not save billing profile" }, { status: 500 });
      }
    } catch (e) {
      const msg =
        e instanceof Stripe.errors.StripeError ? e.message : "Stripe customer creation failed";
      console.error("[stripe-checkout] Stripe customer error:", msg);
      return NextResponse.json({ error: "Could not create Stripe customer" }, { status: 502 });
    }
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

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      console.error("[stripe-checkout] Session created without redirect URL");
      return NextResponse.json({ error: "Checkout session missing redirect URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const msg =
      e instanceof Stripe.errors.StripeError ? `${e.type}: ${e.message}` : "session_create_failed";
    console.error("[stripe-checkout] Stripe session creation failed:", msg);
    return NextResponse.json({ error: "Stripe Checkout session could not be created" }, { status: 502 });
  }
}
