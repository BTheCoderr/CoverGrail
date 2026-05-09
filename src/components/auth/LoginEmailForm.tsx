"use client";

import { useEffect, useState } from "react";
import { loginAction } from "@/app/actions/auth";

const RATE_LIMIT_COOLDOWN_SEC = 60;

type Props = {
  /** True when returning from server after `over_email_send_rate_limit`. */
  rateLimitCooldown: boolean;
  /** User successfully requested a magic link (`sent=1` or legacy `check_email`). */
  linkJustSent: boolean;
};

export function LoginEmailForm({ rateLimitCooldown, linkJustSent }: Props) {
  const [cooldown, setCooldown] = useState(rateLimitCooldown ? RATE_LIMIT_COOLDOWN_SEC : 0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const disabled = cooldown > 0;

  const defaultLabel = "Email me a login link";
  const sentLabel = "Send another login link";
  const buttonLabel =
    cooldown > 0 ? `Wait ${cooldown}s…` : linkJustSent ? sentLabel : defaultLabel;

  return (
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
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 hover:bg-amber-300 ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
