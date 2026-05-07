import type { ComicGradeResult } from "@/lib/ai/comicGradeSchema";

const LABELS: Record<ComicGradeResult["recommendation"], string> = {
  submit: "Submit",
  press_first: "Press first",
  maybe: "Maybe",
  sell_raw: "Sell raw",
  rescan_photos: "Rescan photos",
};

export function RecommendationBadge({
  value,
}: {
  value: ComicGradeResult["recommendation"];
}) {
  const tone =
    value === "submit"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
      : value === "press_first"
        ? "border-sky-500/35 bg-sky-500/10 text-sky-100"
        : value === "maybe"
          ? "border-amber-500/35 bg-amber-400/10 text-amber-100"
          : value === "sell_raw"
            ? "border-zinc-600 bg-zinc-900 text-zinc-200"
            : "border-orange-500/35 bg-orange-500/10 text-orange-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${tone}`}
    >
      {LABELS[value] ?? value}
    </span>
  );
}
