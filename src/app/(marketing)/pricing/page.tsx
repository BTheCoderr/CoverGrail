import { Disclaimer } from "@/components/disclaimer";
import { isStripeCheckoutReady } from "@/lib/stripe";
import Link from "next/link";

type Tier = {
  name: string;
  price: string;
  subtitle: string;
  bullets: string[];
  highlight?: boolean;
  mode: "link" | "disabled" | "stripe";
  href?: string;
  buttonLabel: string;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    subtitle: "3 scans",
    bullets: [
      "Likely grade range",
      "Defect breakdown",
      "Submit / press first / sell raw guidance",
    ],
    mode: "link",
    href: "/login",
    buttonLabel: "Start free",
  },
  {
    name: "Pay per scan",
    price: "$1.99",
    subtitle: "each scan",
    bullets: ["Full structured report", "No subscription commitment"],
    mode: "disabled",
    buttonLabel: "Coming soon",
  },
  {
    name: "Collector",
    price: "$19",
    subtitle: "/ month · 25 scans",
    bullets: ["Batch-friendly workflow", "History & confirmed grades"],
    highlight: true,
    mode: "stripe",
    buttonLabel: "Subscribe",
  },
  {
    name: "Dealer",
    price: "$99",
    subtitle: "/ month · 250 scans",
    bullets: ["Higher throughput", "Priority roadmap input"],
    mode: "stripe",
    buttonLabel: "Subscribe",
  },
];

export default function PricingPage() {
  const stripeReady = isStripeCheckoutReady();

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Pricing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
          Know before you slab it
        </h1>
        <p className="mt-4 text-zinc-400">
          Start free, then scale with pay-per-scan or monthly tiers. Stripe Checkout
          activates once keys and prices are configured.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
            {t.mode === "stripe" ? (
              <form action="/api/create-checkout-session" method="post" className="mt-8">
                <button
                  type="submit"
                  disabled={!stripeReady}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  {stripeReady ? t.buttonLabel : "Connect Stripe to enable"}
                </button>
              </form>
            ) : null}
            {t.mode === "link" && t.href ? (
              <Link
                href={t.href}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400"
              >
                {t.buttonLabel}
              </Link>
            ) : null}
            {t.mode === "disabled" ? (
              <span className="mt-8 inline-flex h-11 cursor-not-allowed items-center justify-center rounded-xl border border-zinc-800 text-sm font-semibold text-zinc-600">
                {t.buttonLabel}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <section className="mx-auto mt-16 max-w-xl rounded-2xl border border-zinc-800/80 bg-zinc-900/30 px-8 py-10 text-center">
        <h2 className="text-lg font-semibold text-zinc-50">Bulk Dealer</h2>
        <p className="mt-3 text-sm text-zinc-400">
          Custom SLAs, throughput, and onboarding for large inventories or retail
          intake.
        </p>
        <a
          href="mailto:sales@covergrail.com"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-600 px-6 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400"
        >
          Contact sales
        </a>
      </section>

      <div className="mx-auto mt-12 max-w-2xl space-y-4">
        <Disclaimer className="text-center text-sm text-zinc-500" />
        <p className="text-center text-xs text-zinc-600">
          Fees shown are illustrative until billing is enabled via Stripe.
        </p>
      </div>
    </main>
  );
}
