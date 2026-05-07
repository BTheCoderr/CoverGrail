import type { ReactNode } from "react";

export function SlabCard({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 shadow-[inset_0_1px_0_rgba(251,191,36,0.08)] ${className}`.trim()}
    >
      {label ? (
        <div className="border-b border-zinc-800/80 bg-zinc-950/80 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            {label}
          </span>
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
