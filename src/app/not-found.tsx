import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-50">That page is not in the collection.</h1>
      <p className="mt-4 text-sm text-zinc-400">The link may be old, private, or no longer available.</p>
      <Link href="/" className="mt-6 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950">Go home</Link>
    </main>
  );
}
