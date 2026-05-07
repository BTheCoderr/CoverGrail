import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="font-semibold tracking-tight text-zinc-100"
          >
            Cover<span className="text-amber-400">Grail</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-400">
            <Link href="/dashboard" className="hover:text-amber-400">
              Dashboard
            </Link>
            <Link href="/scans/new" className="hover:text-amber-400">
              New scan
            </Link>
            <Link href="/collection" className="hover:text-amber-400">
              Collection
            </Link>
            <Link href="/pricing" className="hover:text-amber-400">
              Pricing
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-800/80 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs leading-relaxed text-zinc-500">
            CoverGrail is not affiliated with CGC or CBCS and does not guarantee
            official grading outcomes.
          </p>
        </div>
      </footer>
    </div>
  );
}
