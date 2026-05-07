import type { DetectedDefectItem } from "@/lib/ai/comicGradeSchema";

const AREA_LABEL: Record<string, string> = {
  front_cover: "Front cover",
  back_cover: "Back cover",
  spine: "Spine",
  corners: "Corners",
  edges: "Edges",
  centering: "Centering",
  unknown: "Unknown",
};

export function DefectBreakdown({ defects }: { defects: DetectedDefectItem[] }) {
  if (!defects.length) {
    return (
      <p className="text-sm text-zinc-500">
        No discrete defects parsed—photos may be inconclusive.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {defects.map((d, i) => (
        <div
          key={`${d.area}-${i}`}
          className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
              {AREA_LABEL[d.area] ?? d.area}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              {d.severity} · impact {d.grade_impact}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">{d.defect}</p>
        </div>
      ))}
    </div>
  );
}
