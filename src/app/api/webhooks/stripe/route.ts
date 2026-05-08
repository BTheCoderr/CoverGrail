import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function billingTs(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}

async function resolveProfileUserId(
  admin: SupabaseClient,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();
  if (data?.id) return data.id as string;
  const metaUser = sub.metadata?.user_id;
  return metaUser ?? null;
}

function planFromSubscriptionPriceIds(sub: Stripe.Subscription): {
  plan: "collector" | "dealer";
  monthlyScanLimit: number;
} | null {
  const collectorPrice = process.env.STRIPE_PRICE_COLLECTOR_MONTHLY;
  const dealerPrice = process.env.STRIPE_PRICE_DEALER_MONTHLY;

  for (const item of sub.items.data) {
    const priceObj = item.price;
    const pid = typeof priceObj === "string" ? priceObj : priceObj?.id;
    if (!pid) continue;
    if (collectorPrice && pid === collectorPrice) {
      return { plan: "collector", monthlyScanLimit: 25 };
    }
    if (dealerPrice && pid === dealerPrice) {
      return { plan: "dealer", monthlyScanLimit: 250 };
    }
  }
  return null;
}

function subscriptionPeriodBounds(sub: Stripe.Subscription): { start: number; end: number } {
  const item = sub.items.data[0];
  if (item) {
    return { start: item.current_period_start, end: item.current_period_end };
  }
  return { start: sub.start_date, end: sub.start_date };
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
  const lines = invoice.lines?.data;
  if (lines?.length) {
    for (const line of lines) {
      const direct = line.subscription;
      if (direct) {
        return typeof direct === "string" ? direct : direct.id;
      }
      const itemParent = line.parent;
      if (
        itemParent?.type === "subscription_item_details" &&
        itemParent.subscription_item_details?.subscription
      ) {
        return itemParent.subscription_item_details.subscription;
      }
      if (
        itemParent?.type === "invoice_item_details" &&
        itemParent.invoice_item_details?.subscription
      ) {
        return itemParent.invoice_item_details.subscription;
      }
    }
  }
  return null;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.warn("[stripe-webhook] checkout.session.completed missing metadata user_id or plan");
    return;
  }

  if (session.mode === "payment" && session.payment_status !== "paid") {
    console.warn("[stripe-webhook] checkout.session.completed payment not paid, skipping");
    return;
  }

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[stripe-webhook]", e instanceof Error ? e.message : "admin_client_failed");
    throw e;
  }

  if (plan === "single_scan") {
    const { data: row } = await admin
      .from("profiles")
      .select("paid_scan_credits")
      .eq("id", userId)
      .maybeSingle();

    const next = (row?.paid_scan_credits as number | null | undefined) ?? 0;
    const { error } = await admin
      .from("profiles")
      .update({ paid_scan_credits: next + 1 })
      .eq("id", userId);
    if (error) {
      console.error("[stripe-webhook] Supabase paid_scan_credits update failed:", error.message);
      throw new Error(error.message);
    }
    return;
  }

  if (plan !== "collector" && plan !== "dealer") return;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId) {
    console.error("[stripe-webhook] checkout.session.completed missing subscription id");
    return;
  }

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);

  if (sub.status !== "active" && sub.status !== "trialing") {
    console.warn("[stripe-webhook] Subscription not active after checkout:", sub.status);
    return;
  }

  const monthlyScanLimit = plan === "collector" ? 25 : 250;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  const { start: periodStart, end: periodEnd } = subscriptionPeriodBounds(sub);

  const patch = {
    plan,
    subscription_status: "active" as const,
    monthly_scan_limit: monthlyScanLimit,
    scans_used_this_period: 0,
    stripe_subscription_id: subscriptionId,
    ...(customerId ? { stripe_customer_id: customerId } : {}),
    billing_period_start: billingTs(periodStart),
    billing_period_end: billingTs(periodEnd),
  };

  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) {
    console.error("[stripe-webhook] Supabase subscription checkout profile update failed:", error.message);
    throw new Error(error.message);
  }
}

async function deactivateSubscriptionProfile(subscriptionId: string) {
  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[stripe-webhook]", e instanceof Error ? e.message : "admin_client_failed");
    throw e;
  }

  const { error } = await admin
    .from("profiles")
    .update({
      plan: "free",
      subscription_status: "inactive",
      monthly_scan_limit: 0,
      scans_used_this_period: 0,
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("[stripe-webhook] Supabase subscription delete profile update failed:", error.message);
    throw new Error(error.message);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[stripe-webhook]", e instanceof Error ? e.message : "admin_client_failed");
    throw e;
  }

  const userId = await resolveProfileUserId(admin, sub);
  if (!userId) {
    console.warn("[stripe-webhook] subscription.updated: no profile for subscription", sub.id);
    return;
  }

  /** Align DB with checkout handler; past_due/canceled/etc. stay as Stripe reports. */
  const normalizedStatus =
    sub.status === "trialing" || sub.status === "active" ? "active" : sub.status;

  const fromPrice = planFromSubscriptionPriceIds(sub);
  let resolvedPlan: "collector" | "dealer" | null = null;
  let monthlyScanLimit = 0;

  if (fromPrice) {
    resolvedPlan = fromPrice.plan;
    monthlyScanLimit = fromPrice.monthlyScanLimit;
  } else if (sub.metadata?.plan === "collector" || sub.metadata?.plan === "dealer") {
    resolvedPlan = sub.metadata.plan as "collector" | "dealer";
    monthlyScanLimit = resolvedPlan === "collector" ? 25 : 250;
  } else {
    const { data: prof } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
    const p = prof?.plan as string | undefined;
    if (p === "collector" || p === "dealer") {
      resolvedPlan = p;
      monthlyScanLimit = resolvedPlan === "collector" ? 25 : 250;
    }
  }

  const { start: periodStart, end: periodEnd } = subscriptionPeriodBounds(sub);

  const patch: Record<string, string | number> = {
    subscription_status: normalizedStatus,
    stripe_subscription_id: sub.id,
    billing_period_start: billingTs(periodStart),
    billing_period_end: billingTs(periodEnd),
  };

  if (resolvedPlan) {
    patch.plan = resolvedPlan;
    patch.monthly_scan_limit = monthlyScanLimit;
  }

  const { error } = await admin.from("profiles").update(patch).eq("id", userId);

  if (error) {
    console.error("[stripe-webhook] Supabase subscription.updated profile failed:", error.message);
    throw new Error(error.message);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== "subscription_cycle") return;

  const subId = invoiceSubscriptionId(invoice);
  if (!subId) return;

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[stripe-webhook]", e instanceof Error ? e.message : "admin_client_failed");
    throw e;
  }

  const patch: Record<string, string | number> = {
    scans_used_this_period: 0,
  };

  if (invoice.period_start) {
    patch.billing_period_start = billingTs(invoice.period_start);
  }
  if (invoice.period_end) {
    patch.billing_period_end = billingTs(invoice.period_end);
  }

  const { error } = await admin.from("profiles").update(patch).eq("stripe_subscription_id", subId);
  if (error) {
    console.error("[stripe-webhook] invoice.payment_succeeded profile update failed:", error.message);
    throw new Error(error.message);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = invoiceSubscriptionId(invoice);
  if (!subId) {
    console.warn("[stripe-webhook] invoice.payment_failed: could not resolve subscription id");
    return;
  }

  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[stripe-webhook]", e instanceof Error ? e.message : "admin_client_failed");
    throw e;
  }

  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: "past_due" })
    .eq("stripe_subscription_id", subId);

  if (error) {
    console.error("[stripe-webhook] invoice.payment_failed profile update failed:", error.message);
    throw new Error(error.message);
  }

  console.warn("[stripe-webhook] invoice.payment_failed processed for subscription", subId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch (e) {
    console.error("[stripe-webhook]", e instanceof Error ? e.message : "Stripe init failed");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("[stripe-webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_signature";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
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
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "handler_failed";
    console.error("[stripe-webhook] Handler error:", msg);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
