import { SlabCard } from "@/components/slab-card";
import { subscriptionIsActiveForScans } from "@/lib/billing/scanQuota";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const ENTERPRISE_MAIL =
  "mailto:hello@covergrail.com?subject=CoverGrail%20Enterprise%20Licensing";

function planDisplayName(plan: string | null | undefined): string {
  const p = plan ?? "free";
  if (p === "free") return "Free starter";
  if (p === "dealer") return "Pro Dealer";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "plan, free_scans_remaining, paid_scan_credits, subscription_status, monthly_scan_limit, scans_used_this_period, billing_period_end",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: scans } = await supabase
    .from("comic_scans")
    .select("id,title,status,created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const monthlyLimit = profile?.monthly_scan_limit ?? 0;
  const monthlyUsed = profile?.scans_used_this_period ?? 0;
  const subscriptionActive = subscriptionIsActiveForScans(profile?.subscription_status);

  const monthlyLabel =
    subscriptionActive && monthlyLimit > 0
      ? `${monthlyUsed} / ${monthlyLimit}`
      : "—";

  return (
    <div className="space-y-10">
      {params.checkout === "success" ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
          Checkout completed. If credits or your subscription do not appear within a minute,
          refresh this page while Stripe finishes processing your payment.
        </p>
      ) : null}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SlabCard label="Current plan">
          <p className="text-sm text-zinc-400">Tier</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {planDisplayName(profile?.plan)}
          </p>
          {profile?.subscription_status ? (
            <p className="mt-2 text-xs uppercase tracking-wider text-zinc-500">
              Billing: {profile.subscription_status}
            </p>
          ) : null}
        </SlabCard>
        <SlabCard label="Free scans remaining">
          <p className="text-sm text-zinc-400">Complimentary quota</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {profile?.free_scans_remaining ?? 0}
          </p>
        </SlabCard>
        <SlabCard label="Paid scan credits">
          <p className="text-sm text-zinc-400">One-time purchases</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {profile?.paid_scan_credits ?? 0}
          </p>
        </SlabCard>
        <SlabCard label="Monthly usage">
          <p className="text-sm text-zinc-400">Subscription scans this period</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{monthlyLabel}</p>
          {profile?.billing_period_end && subscriptionActive && monthlyLimit > 0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              Period ends {new Date(profile.billing_period_end).toLocaleDateString()}
            </p>
          ) : null}
        </SlabCard>
      </div>

      <SlabCard label="Upgrade">
        <p className="text-sm text-zinc-400">
          Need more scans or a monthly plan? Add credits, upgrade to Collector, or scale with Pro
          Dealer—all from pricing.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            View plans & pricing
          </Link>
          <a
            href={ENTERPRISE_MAIL}
            className="text-sm font-semibold text-zinc-400 hover:text-amber-400"
          >
            Enterprise licensing →
          </a>
        </div>
      </SlabCard>

      <SlabCard label="Quick action">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/scans/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-400 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            New scan
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-amber-400 hover:underline"
          >
            Pricing →
          </Link>
        </div>
      </SlabCard>

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
