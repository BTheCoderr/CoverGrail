import { ExampleResult } from "@/components/landing/ExampleResult";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { Disclaimer } from "@/components/disclaimer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-16 sm:gap-28 sm:py-24">
      <Hero />

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

      <ExampleResult />

      <PricingPreview />

      <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-zinc-900/80 to-zinc-950 px-6 py-10 text-center sm:px-12">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Dealers & bulk
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
          Need volume scanning for bins or incoming submissions? Dealer plans and
          bulk onboarding are available—contact sales for throughput and SLAs.
        </p>
        <a
          href="mailto:sales@covergrail.com"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-zinc-600 px-6 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400"
        >
          Contact sales
        </a>
      </section>

      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-6 py-8">
        <Disclaimer className="text-center text-sm text-zinc-500" />
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-zinc-600">
          Predictions are educational pre-submission estimates. CoverGrail is not
          affiliated with CGC or CBCS.
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
