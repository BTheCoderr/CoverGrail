import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/** Server-only Stripe SDK instance. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  stripeSingleton ??= new Stripe(key);
  return stripeSingleton;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Enough env for Checkout Session redirects (publishable key optional until Elements). */
export function isStripeCheckoutReady(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_SITE_URL &&
      process.env.STRIPE_PRICE_SINGLE_SCAN &&
      process.env.STRIPE_PRICE_COLLECTOR_MONTHLY &&
      process.env.STRIPE_PRICE_DEALER_MONTHLY,
  );
}
