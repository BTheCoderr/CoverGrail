import { Disclaimer } from "@/components/disclaimer";
import Link from "next/link";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Spine stress and color-breaking ticks",
    body:
      "Stress lines along the spine often indicate repeated opens or tight stacking. Color-breaking ticks—where ink fractures across the color layer—typically deduct more than a faint bend that stays inside one hue. Train your eye to separate shadows from actual fractures under tilted light.",
  },
  {
    title: "Corner blunting",
    body:
      "Sharp corners carry disproportionate weight at high grades. Blunting—rounding at the tip—is graded more harshly on Silver Age keys where pristine corners were expected at shipment. Compare all four corners; inconsistent wear may hint at handling versus manufacture trims.",
  },
  {
    title: "Cover creases",
    body:
      "A crease can be soft (mostly paper distortion) or sharp (fiber breakdown). Length, location (cover logo vs. unobtrusive edge), and whether color breaks all influence perceived tier. Multiple short creases often compound beyond what collectors assume from any single line.",
  },
  {
    title: "Back cover stains",
    body:
      "Finger oils, moisture rings, and migration from tape residue usually sit on the back cover first. Check gutters and inner edges where shelving contact concentrates damage. Stains that penetrate fibers generally hurt more than surface grime that could lift with cautious cleaning.",
  },
  {
    title: "Centering and wrap",
    body:
      "Front-to-back wrap misalignment and left/right centering matter most on books marketed as investment-grade. Margins that drift consistently toward one edge suggest trimming risks graders investigate—pair visual centering with square binds before assuming you have a gem.",
  },
  {
    title: "Pressable vs non-pressable defects",
    body:
      "Light bends, shallow stacking dimples, and certain shallow waves sometimes respond to professional pressing if inks are stable. Tears, missing chips, stains that moved pigment, and brittle splits typically do not press out—and aggressive pressing can create new defects.",
  },
  {
    title: "When to submit, press first, or sell raw",
    body:
      "Submit when predicted brackets justify fees after defects are accounted for. Consider pressing first when soft defects dominate value drag but substrate integrity supports it. Sell raw when upside after grading fees is thin—or when defects make tier jumps unlikely compared with buyer appetite for raw keys.",
  },
];

export default function GradingGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Lead guide
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Free Comic Grading Guide
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Learn the visible defects that lower comic grades before you submit to CGC or CBCS.
        </p>
      </header>

      <article className="mt-14 space-y-12">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-100">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{s.body}</p>
          </section>
        ))}
      </article>

      <section className="mt-16 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-zinc-900/90 to-zinc-950 px-8 py-10 text-center">
        <p className="text-base font-medium text-zinc-100">
          Create your free CoverGrail account and get 3 free pre-grades.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-400 px-6 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-amber-400 hover:underline"
          >
            View pricing →
          </Link>
        </div>
      </section>

      <div className="mx-auto mt-14 max-w-2xl space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-6 py-8">
        <Disclaimer className="text-center text-sm text-zinc-500" />
        <ul className="space-y-2 text-center text-xs leading-relaxed text-zinc-600">
          <li>CoverGrail is not affiliated with CGC or CBCS.</li>
          <li>Predictions are educational pre-submission estimates.</li>
          <li>CoverGrail does not guarantee official grading outcomes.</li>
        </ul>
      </div>
    </main>
  );
}
