"use client";

import type { ReactNode } from "react";

type Props = {
  plan: "single_scan" | "collector" | "dealer";
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function PlanCheckoutButton({ plan, disabled, className, children }: Props) {
  async function startCheckout() {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) {
      window.alert(data.error ?? "Could not start checkout");
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void startCheckout()}
      className={className}
    >
      {children}
    </button>
  );
}
