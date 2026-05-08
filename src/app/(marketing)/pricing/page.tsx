import { Disclaimer } from "@/components/disclaimer";
import { PlanCheckoutButton } from "@/components/pricing/PlanCheckoutButton";
import { isStripeCheckoutReady } from "@/lib/stripe";
import Link from "next/link";

type Tier = {
  name: string;
  price: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
  mode: "link" | "stripe" | "mailto";
  href?: string;
  mailtoHref?: string;
  buttonLabel: string;
  checkoutPlan?: "single_scan" | "collector" | "dealer";
};

const ENTERPRISE_MAIL =
  "mailto:hello@covergrail.com?subject=CoverGrail%20Enterprise%20Licensing";

const TIERS: Tier[] = [
  {
    name: "Free Starter",
    price: "$0",
    subtitle: "Start here",
    bullets: [
      "Includes 3 free scans",
      "Basic grade range",
      "Defect breakdown",
      "Save scan history",
    ],
    mode: "link",
    href: "/login",
    buttonLabel: "Start free",
  },
  {
    name: "Single Scan",
    price: "$1.99",
    subtitle: "One-time",
    bullets: [
      "Adds 1 paid scan credit",
      "Best for testing one book before submission",
    ],
    mode: "stripe",
    checkoutPlan: "single_scan",
    buttonLabel: "Buy 1 scan",
  },
  {
    name: "Collector",
    price: "$19.99",
    subtitle: "/ month · 25 scans",
    bullets: [
      "Collection history",
      "Confirmed grade tracking",
      "Best for active collectors",
    ],
    highlight: true,
    mode: "stripe",
    checkoutPlan: "collector",
    buttonLabel: "Subscribe",
  },
  {
    name: "Pro Dealer",
    price: "$150",
    subtitle: "/ month · 250 scans",
    bullets: [
      "Bulk lot workflow placeholder",
      "Exportable reports placeholder",
      "Priority roadmap access",
      "Best for dealers, estate buyers, and shop owners",
    ],
    mode: "stripe",
    checkoutPlan: "dealer",
    buttonLabel: "Subscribe",
  },
  {
    name: "Enterprise",
    price: "Custom",
    subtitle: "Starting at $10,000/year",
    bullets: [
      "API access placeholder",
      "White-label/integration support placeholder",
      "For retailers, auction houses, and platforms",
    ],
    mode: "mailto",
    mailtoHref: ENTERPRISE_MAIL,
    buttonLabel: "Contact Sales",
  },
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params = await searchParams;
  const stripeReady = isStripeCheckoutReady();

  return (
    <main className="mx-auto max-w-7xl px-4 py-16">
      {params.checkout === "cancelled" ? (
        <p className="mx-auto mb-10 max-w-xl rounded-xl border border-zinc-600/40 bg-zinc-900/40 px-4 py-3 text-center text-sm text-zinc-300">
          Checkout was cancelled. No charges were made—you can try again whenever you are ready.
        </p>
      ) : null}
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Pricing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
          Know before you slab it
        </h1>
        <p className="mt-4 text-zinc-400">
          Move up the ladder—from free education to pay-per-scan, subscriptions, and enterprise
          licensing. Stripe Checkout powers paid tiers once keys and prices are configured.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`flex flex-col rounded-2xl border p-6 ${
              t.highlight
                ? "border-amber-500/35 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-[inset_0_1px_0_rgba(251,191,36,0.12)]"
                : "border-zinc-800/80 bg-zinc-900/40"
            }`}
          >
            <h2 className="text-lg font-semibold text-zinc-50">{t.name}</h2>
            <p className="mt-2 text-sm text-zinc-400">{t.subtitle}</p>
            <p className="mt-6 text-3xl font-semibold text-zinc-50">{t.price}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-zinc-400">
              {t.bullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
            {t.mode === "stripe" && t.checkoutPlan ? (
              <PlanCheckoutButton
                plan={t.checkoutPlan}
                disabled={!stripeReady}
                className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {stripeReady ? t.buttonLabel : "Configure Stripe to enable"}
              </PlanCheckoutButton>
            ) : null}
            {t.mode === "link" && t.href ? (
              <Link
                href={t.href}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400"
              >
                {t.buttonLabel}
              </Link>
            ) : null}
            {t.mode === "mailto" && t.mailtoHref ? (
              <a
                href={t.mailtoHref}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-600 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400"
              >
                {t.buttonLabel}
              </a>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <Disclaimer className="text-center text-sm text-zinc-500" />
      </div>
    </main>
  );
}
