import Link from "next/link";
import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check_email?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8">
        <h1 className="text-center text-2xl font-semibold text-zinc-50">
          Sign in to CoverGrail
        </h1>
        <p className="mt-3 text-center text-sm text-zinc-400">
          Magic link authentication powered by Supabase.
        </p>

        {params.check_email ? (
          <p className="mt-6 rounded-xl border border-amber-500/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Check your email for the sign-in link. You can close this tab once
            it arrives.
          </p>
        ) : null}

        {params.error ? (
          <p className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {decodeURIComponent(params.error)}
          </p>
        ) : null}

        <form action={loginAction} className="mt-8 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-400/0 transition focus:border-amber-500/50 focus:ring-4 focus:ring-amber-400/15"
            />
          </label>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Email me a login link
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-zinc-500">
          CoverGrail is not affiliated with CGC or CBCS and does not guarantee
          official grading outcomes.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 text-center text-sm text-zinc-500 hover:text-amber-400"
      >
        ← Back to landing
      </Link>
    </main>
  );
}
