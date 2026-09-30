export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
        Loading CoverGrail…
      </div>
    </div>
  );
}
