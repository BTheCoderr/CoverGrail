import Link from "next/link";
import { Disclaimer } from "@/components/disclaimer";

export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/80 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold text-zinc-200">CoverGrail</p>
          <p className="text-xs text-zinc-500">Before you slab it, scan it.</p>
          <Disclaimer />
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
          <Link href="/pricing" className="hover:text-amber-400">
            Pricing
          </Link>
          <Link href="/disclaimer" className="hover:text-amber-400">
            Disclaimer
          </Link>
          <Link href="/login" className="hover:text-amber-400">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
