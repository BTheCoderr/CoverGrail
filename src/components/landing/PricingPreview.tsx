import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    detail: "3 scans",
    bullets: ["Likely grade range", "Defect report", "Recommendation"],
  },
  {
    name: "Pay per scan",
    price: "$1.99",
    detail: "per scan",
    bullets: ["No subscription", "Same full report"],
  },
  {
    name: "Collector",
    price: "$19.99",
    detail: "/mo · 25 scans",
    bullets: ["Private grading history", "25 scans/month when paid grading launches"],
  },
];

export function PricingPreview() {
  return (
    <section className="mx-auto max-w-5xl px-4">
      <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
        Pricing
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-400">
        Start free. Paid plans remain paused while live grading quality is validated.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t.name}
            </p>
            <p className="mt-3 text-3xl font-semibold text-zinc-50">{t.price}</p>
            <p className="text-sm text-zinc-400">{t.detail}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              {t.bullets.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/pricing"
          className="text-sm font-semibold text-amber-400 hover:underline"
        >
          Full pricing & dealer tiers →
        </Link>
      </div>
    </section>
  );
}
