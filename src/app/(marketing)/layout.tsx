import Link from "next/link";
import { MarketingFooter } from "@/components/marketing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="font-semibold tracking-tight">
            Cover<span className="text-amber-400">Grail</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
            <Link href="/grading-guide" className="hover:text-amber-400">
              Grading guide
            </Link>
            <Link href="/pricing" className="hover:text-amber-400">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-amber-400">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
