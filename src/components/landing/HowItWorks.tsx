const STEPS = [
  {
    title: "Upload slab-quality photos",
    body: "Front, back, spine, and optional corners—neutral light, parallel camera.",
  },
  {
    title: "Get a predicted grade range",
    body: "Conservative pre-submission estimate with defect cues—not an official grade.",
  },
  {
    title: "Decide: submit, press first, or sell raw",
    body: "Practical next steps weighed against typical grading fees.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4">
      <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
        How it works
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-lg font-medium text-zinc-100">
        Upload photos, get a grade range, decide before submitting blind.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6"
          >
            <span className="text-xs font-semibold text-zinc-500">
              Step {i + 1}
            </span>
            <h3 className="mt-2 text-base font-semibold text-zinc-50">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
