import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function billingTs(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

async function profileIdForSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const admin = createAdminClient();
  const metaUser = sub.metadata?.user_id;
  if (metaUser) return metaUser;

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  return data?.id ?? null;
}

function subscriptionPeriodBounds(sub: Stripe.Subscription): { start: number; end: number } {
  const item = sub.items.data[0];
  if (item) {
    return { start: item.current_period_start, end: item.current_period_end };
  }
  return { start: sub.start_date, end: sub.start_date };
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan;

  if (!userId || !plan) return;

  if (session.mode === "payment" && session.payment_status !== "paid") {
    return;
  }

  const admin = createAdminClient();

  if (plan === "single_scan") {
    const { data: row } = await admin
      .from("profiles")
      .select("paid_scan_credits")
      .eq("id", userId)
      .maybeSingle();

    const next = (row?.paid_scan_credits as number | null | undefined) ?? 0;
    await admin
      .from("profiles")
      .update({ paid_scan_credits: next + 1 })
      .eq("id", userId);
    return;
  }

  if (plan !== "collector" && plan !== "dealer") return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  if (sub.status !== "active" && sub.status !== "trialing") {
    return;
  }

  const monthlyScanLimit = plan === "collector" ? 25 : 250;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const subscriptionStatus =
    sub.status === "trialing" ? "trialing" : sub.status === "active" ? "active" : sub.status;

  const { start: periodStart, end: periodEnd } = subscriptionPeriodBounds(sub);

  await admin
    .from("profiles")
    .update({
      plan,
      subscription_status: subscriptionStatus,
      monthly_scan_limit: monthlyScanLimit,
      scans_used_this_period: 0,
      stripe_subscription_id: subscriptionId,
      ...(customerId ? { stripe_customer_id: customerId } : {}),
      billing_period_start: billingTs(periodStart),
      billing_period_end: billingTs(periodEnd),
    })
    .eq("id", userId);
}

async function deactivateSubscriptionProfile(subscriptionId: string) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      subscription_status: "inactive",
      plan: "free",
      monthly_scan_limit: 0,
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscriptionId);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const userId = await profileIdForSubscription(sub);
  if (!userId) return;

  const admin = createAdminClient();
  const activeLike = sub.status === "active" || sub.status === "trialing";

  if (!activeLike) {
    const { start: periodStart, end: periodEnd } = subscriptionPeriodBounds(sub);
    await admin
      .from("profiles")
      .update({
        subscription_status: "inactive",
        plan: "free",
        monthly_scan_limit: 0,
        billing_period_start: billingTs(periodStart),
        billing_period_end: billingTs(periodEnd),
      })
      .eq("id", userId);
    return;
  }

  const metaPlan = sub.metadata?.plan;
  let resolvedPlan: "collector" | "dealer" = "collector";
  if (metaPlan === "collector" || metaPlan === "dealer") {
    resolvedPlan = metaPlan;
  } else {
    const { data: prof } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    const p = prof?.plan as string | undefined;
    if (p === "collector" || p === "dealer") {
      resolvedPlan = p;
    }
  }

  const monthlyScanLimit = resolvedPlan === "collector" ? 25 : 250;

  const { start: periodStart, end: periodEnd } = subscriptionPeriodBounds(sub);

  await admin
    .from("profiles")
    .update({
      plan: resolvedPlan,
      subscription_status: sub.status === "trialing" ? "trialing" : "active",
      monthly_scan_limit: monthlyScanLimit,
      stripe_subscription_id: sub.id,
      billing_period_start: billingTs(periodStart),
      billing_period_end: billingTs(periodEnd),
    })
    .eq("id", userId);
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (
    parent?.type === "subscription_details" &&
    parent.subscription_details?.subscription
  ) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : sub.id;
  }
  return null;
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle") return;

  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  const admin = createAdminClient();
  const patch: Record<string, string | number> = {
    scans_used_this_period: 0,
  };

  if (invoice.period_start) {
    patch.billing_period_start = billingTs(invoice.period_start);
  }
  if (invoice.period_end) {
    patch.billing_period_end = billingTs(invoice.period_end);
  }

  await admin.from("profiles").update(patch).eq("stripe_subscription_id", subId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await deactivateSubscriptionProfile((event.data.object as Stripe.Subscription).id);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("stripe webhook handler error", e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
