export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-relaxed text-zinc-500 ${className}`.trim()}
    >
      CoverGrail is not affiliated with CGC or CBCS and does not guarantee
      official grading outcomes. Predictions are educational pre-submission
      estimates.
    </p>
  );
}
