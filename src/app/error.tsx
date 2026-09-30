"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold text-zinc-50">CoverGrail hit an unexpected error.</h1>
      <p className="mt-4 text-sm text-zinc-400">
        Your account data was not intentionally changed. You can retry this screen or return to the dashboard.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-zinc-600">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950">Try again</button>
        <a href="/dashboard" className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200">Dashboard</a>
      </div>
    </main>
  );
}
