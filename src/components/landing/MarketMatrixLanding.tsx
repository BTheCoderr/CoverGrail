import Link from "next/link";
import { SlabCard } from "@/components/slab-card";

const POSITIONING_CARDS = [
  {
    title: "Pre-Submission Decision Engine",
    description:
      "CoverGrail sits before CGC/CBCS submission and helps answer whether a book is worth sending in.",
  },
  {
    title: "Confirmed-Grade Feedback Loop",
    description:
      "Users can update scans with official CGC/CBCS results so prediction accuracy improves over time.",
  },
  {
    title: "Dealer Lot Intelligence",
    description:
      "Dealers can evaluate large groups of books and prioritize which ones deserve grading, pressing, or raw sale.",
  },
  {
    title: "Actionable Recommendations",
    description:
      "Every scan ends with a practical recommendation: submit, press first, sell raw, hold, or rescan photos.",
  },
] as const;

export function MarketMatrixLanding() {
  return (
    <>
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/35 px-6 py-10 sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          More Than an AI Grade
        </h2>
        <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-zinc-400">
          <p className="text-base text-zinc-300">
            Most grading tools stop at a predicted number. CoverGrail goes further.
          </p>
          <p>
            CoverGrail helps collectors decide whether a comic should be submitted, pressed first,
            sold raw, or rescanned with better photos. Every result includes a predicted grade range,
            confidence score, visible defect breakdown, photo quality score, and action
            recommendation.
          </p>
          <p>
            When users add their confirmed CGC or CBCS grade later, CoverGrail uses that outcome to
            improve accuracy by era, condition range, and visible defect type.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {POSITIONING_CARDS.map((card) => (
            <SlabCard key={card.title} label={card.title}>
              <p className="text-sm leading-relaxed text-zinc-400">{card.description}</p>
            </SlabCard>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-6 py-10 sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Market Position
        </h2>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-zinc-400">
          CoverGrail is not trying to replace professional grading. It sits before it. Collectors
          already know CGC and CBCS provide the final official grade. CoverGrail helps answer the
          earlier question: is this book worth sending in at all?
        </p>

        <div className="relative mx-auto mt-10 max-w-lg">
          <div className="absolute -left-1 bottom-0 top-8 hidden w-24 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:block">
            Low<br />
            value
          </div>
          <div className="absolute -right-1 bottom-0 top-8 hidden w-24 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:block">
            High<br />
            value
          </div>
          <div className="absolute -bottom-6 left-8 right-8 hidden justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:flex">
            <span>Low uniqueness</span>
            <span>High uniqueness</span>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-700/80 sm:mx-8">
            <div className="bg-zinc-900/90 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Commodity Play
              </p>
              <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                Low uniqueness · High value
              </p>
            </div>
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/40 p-4 ring-2 ring-inset ring-amber-500/40 sm:p-5">
              <p className="absolute right-2 top-2 rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                Category King Potential
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-amber-400/95">
                Category King
              </p>
              <p className="mt-2 text-[11px] leading-snug text-zinc-400">
                High uniqueness · High value
              </p>
            </div>
            <div className="bg-zinc-900/90 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Low Impact
              </p>
              <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                Low uniqueness · Low value
              </p>
            </div>
            <div className="bg-zinc-900/90 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Tech Novelty
              </p>
              <p className="mt-2 text-[11px] leading-snug text-zinc-500">
                High uniqueness · Low value
              </p>
            </div>
          </div>
          <p className="mx-auto mt-12 max-w-md text-center text-[10px] uppercase tracking-wider text-zinc-600 sm:hidden">
            Rows: low → high value · Columns: low → high uniqueness
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-2xl gap-4 sm:grid-cols-2">
          <SlabCard label="Current Generic AI Grader">
            <dl className="space-y-2 text-sm text-zinc-400">
              <div className="flex justify-between gap-4">
                <dt>Uniqueness</dt>
                <dd className="font-semibold tabular-nums text-zinc-200">4 / 10</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Value</dt>
                <dd className="font-semibold tabular-nums text-zinc-200">6 / 10</dd>
              </div>
            </dl>
          </SlabCard>
          <SlabCard label="CoverGrail Decision Engine">
            <dl className="space-y-2 text-sm text-zinc-400">
              <div className="flex justify-between gap-4">
                <dt>Uniqueness</dt>
                <dd className="font-semibold tabular-nums text-amber-400">7 / 10</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Value</dt>
                <dd className="font-semibold tabular-nums text-amber-400">8.5 / 10</dd>
              </div>
            </dl>
          </SlabCard>
        </div>

        <div className="mt-10 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-5 py-4">
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            CoverGrail is not affiliated with CGC or CBCS. Predictions are educational
            pre-submission estimates. CoverGrail does not guarantee official grading outcomes.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-400 px-8 text-sm font-semibold text-zinc-950 shadow-[0_0_40px_-10px_rgba(251,191,36,0.45)] transition hover:bg-amber-300"
          >
            Start with 3 free pre-grades
          </Link>
        </div>
      </section>
    </>
  );
}
