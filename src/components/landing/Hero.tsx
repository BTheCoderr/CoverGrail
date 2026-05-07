import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <p className="mb-3 text-sm font-medium tracking-wide text-zinc-400">
        Before you slab it, scan it.
      </p>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400/90">
        Pre-submission estimates
      </p>
      <h1 className="text-balance font-[family-name:var(--font-cormorant)] text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
        Know if your comic is worth grading before you pay CGC.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-400">
        Upload front, back, and spine photos. CoverGrail estimates a likely grade
        range, flags visible defects, and tells you whether to submit, press
        first, or sell raw.
      </p>
      <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
        CoverGrail gives collectors a pre-submission grade range, defect report,
        and submit-or-sell recommendation before they spend money on professional
        grading.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-400 px-8 text-sm font-semibold text-zinc-950 shadow-[0_0_40px_-10px_rgba(251,191,36,0.55)] transition hover:bg-amber-300"
        >
          Get 3 Free Pre-Grades
        </Link>
        <a
          href="#example-result"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-600 px-8 text-sm font-semibold text-zinc-200 hover:border-amber-500/40 hover:text-amber-400"
        >
          See Example Result
        </a>
      </div>
    </section>
  );
}
