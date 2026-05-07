import { DefectBreakdown } from "@/components/scans/DefectBreakdown";
import { RecommendationBadge } from "@/components/scans/RecommendationBadge";
import { SlabCard } from "@/components/slab-card";
import { getMockComicGrade } from "@/lib/ai/mockComicGrade";

export function ExampleResult() {
  const demo = getMockComicGrade();

  return (
    <section
      id="example-result"
      className="mx-auto max-w-5xl scroll-mt-24 px-4"
    >
      <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
        Example result
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-zinc-400">
        Illustrative slab-style output—your scan will reflect your photos and
        metadata.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <SlabCard label="Predicted grade range" className="lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Likely grade range (pre-submission)
          </p>
          <p className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">
            {demo.predicted_grade_low.toFixed(1)} –{" "}
            {demo.predicted_grade_high.toFixed(1)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Confidence: {demo.confidence}
            </span>
            <RecommendationBadge value={demo.recommendation} />
          </div>
        </SlabCard>

        <SlabCard label="Photo quality">
          <p className="text-4xl font-semibold text-zinc-50">
            {demo.photo_quality_score}
            <span className="text-lg font-normal text-zinc-500">/10</span>
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            Higher scores mean clearer evidence for the predicted range.
          </p>
        </SlabCard>

        <SlabCard label="Defect breakdown" className="lg:col-span-3">
          <DefectBreakdown defects={demo.detected_defects} />
        </SlabCard>

        <SlabCard label="Economics (illustrative)">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Est. grading cost
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            ${demo.estimated_grading_cost.toFixed(0)}
          </p>
          <p className="mt-4 text-xs uppercase tracking-wider text-zinc-500">
            Est. upside (USD)
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-400/90">
            {demo.estimated_upside != null
              ? `$${demo.estimated_upside.toFixed(0)}`
              : "—"}
          </p>
        </SlabCard>

        <SlabCard label="Reasoning & next steps" className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-zinc-300">
            {demo.reasoning_summary}
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-400">
            {demo.next_steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </SlabCard>
      </div>
    </section>
  );
}
