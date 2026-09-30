"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-semibold">CoverGrail needs a retry.</h1>
          <p className="mt-4 text-sm text-zinc-400">The page could not finish loading.</p>
          <button onClick={reset} className="mt-6 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950">Reload</button>
        </main>
      </body>
    </html>
  );
}
