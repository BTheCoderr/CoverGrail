import { ExampleResult } from "@/components/landing/ExampleResult";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MarketMatrixLanding } from "@/components/landing/MarketMatrixLanding";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { Disclaimer } from "@/components/disclaimer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-16 sm:gap-28 sm:py-24">
      <Hero />

      <section className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-900/70 to-zinc-950 px-6 py-10 sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Free Comic Grading Guide
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-300">
          Before you pay to slab a book, learn the visible defects that move a comic from 9.4
          to 8.0.
        </p>
        <Link
          href="/grading-guide"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-amber-400 px-6 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
        >
          Read the Free Guide
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 px-6 py-10 sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          The problem
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-200">
          Professional grading is expensive—and most collectors submit blind.
          Paying to slab without knowing your likely bracket burns margin fast.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
          CoverGrail answers one practical question before you spend that money:
          submit, press first, or sell raw?
        </p>
      </section>

      <HowItWorks />

      <MarketMatrixLanding />

      <ExampleResult />

      <PricingPreview />

      <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-zinc-900/80 to-zinc-950 px-6 py-10 text-center sm:px-12">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Enterprise licensing
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
          Retailers, auction houses, and platforms: API access, white-label options, and custom
          integrations—starting at $10,000/year. Tell us what you are building.
        </p>
        <a
          href="mailto:hello@covergrail.com?subject=CoverGrail%20Enterprise%20Licensing"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-600 px-6 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400"
        >
          Contact sales
        </a>
      </section>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-6 py-8">
        <Disclaimer className="text-center text-sm text-zinc-500" />
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-zinc-600">
          Predictions are educational pre-submission estimates. CoverGrail does not guarantee
          official grading outcomes. CoverGrail is not affiliated with CGC or CBCS.
        </p>
        <div className="mt-6 text-center">
          <Link href="/disclaimer" className="text-sm text-amber-400 hover:underline">
            Full disclaimer
          </Link>
        </div>
      </section>
    </main>
  );
}
