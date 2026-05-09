import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { isDemoMode } from "@/lib/demo/mode";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = isDemoMode();

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
            {demo ? (
              <>
                <Link href="/dashboard" className="hover:text-amber-400">
                  View Demo Dashboard
                </Link>
                <Link href="/scans/demo" className="hover:text-amber-400">
                  Demo Result
                </Link>
              </>
            ) : null}
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
            {demo ? (
              <Link
                href="/login"
                className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400"
              >
                Sign in
              </Link>
            ) : (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400"
                >
                  Sign out
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>
      {demo ? (
        <div
          role="status"
          className="border-b border-amber-500/35 bg-amber-950/50 px-4 py-2.5 text-center text-xs font-medium leading-snug text-amber-100/95"
        >
          Demo mode: sample data only. Real scans require login.
        </div>
      ) : null}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-zinc-800/80 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {demo ? (
            <p className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400">
              <Link href="/dashboard" className="font-medium hover:text-amber-400">
                View Demo Dashboard → /dashboard
              </Link>
              <Link href="/scans/demo" className="font-medium hover:text-amber-400">
                Demo Result → /scans/demo
              </Link>
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-zinc-500">
            CoverGrail is not affiliated with CGC or CBCS and does not guarantee
            official grading outcomes.
          </p>
        </div>
      </footer>
    </div>
  );
}
