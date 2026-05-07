import { SlabCard } from "@/components/slab-card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, free_scans_remaining")
    .eq("id", user.id)
    .maybeSingle();

  const { data: scans } = await supabase
    .from("comic_scans")
    .select("id,title,status,created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const unlimitedPlans = new Set([
    "collector",
    "dealer",
    "bulk",
    "pay_per_scan",
  ]);
  const hasUnlimited = unlimitedPlans.has(profile?.plan ?? "");

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
          Your grading runway
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Before you slab it, scan it—likely grade range, defect cues, and submit
          / press first / sell raw guidance before you pay grading fees.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SlabCard label="Plan">
          <p className="text-sm text-zinc-400">Current tier</p>
          <p className="mt-2 text-2xl font-semibold capitalize text-zinc-50">
            {profile?.plan ?? "free"}
          </p>
        </SlabCard>
        <SlabCard label="Scan quota">
          <p className="text-sm text-zinc-400">Remaining this account</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {hasUnlimited ? "Unlimited" : `${profile?.free_scans_remaining ?? 0}`}
          </p>
        </SlabCard>
        <SlabCard label="Quick action">
          <Link
            href="/scans/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            New scan
          </Link>
          <Link
            href="/pricing"
            className="mt-3 block text-xs text-zinc-500 hover:text-amber-400"
          >
            View pricing →
          </Link>
        </SlabCard>
      </div>

      <SlabCard label="Recent scans">
        {!scans?.length ? (
          <p className="text-sm text-zinc-400">
            No scans yet. Start with three complimentary pre-grades.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800/80">
            {scans.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 py-4">
                <div className="flex-1">
                  <p className="font-medium text-zinc-100">{row.title}</p>
                  <p className="text-xs uppercase tracking-widest text-zinc-500">
                    {row.status}
                  </p>
                </div>
                <Link
                  href={`/scans/${row.id}`}
                  className="text-sm font-semibold text-amber-400 hover:underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SlabCard>
    </div>
  );
}
