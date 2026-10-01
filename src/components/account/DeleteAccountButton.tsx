"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAccountButton() {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (confirmText !== "DELETE" || busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: invokeError } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });
      if (invokeError) throw invokeError;
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/?account=deleted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete account");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        This permanently deletes your account, scans, results, confirmed grades, feedback,
        telemetry events, and uploaded comic images.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder='Type DELETE to confirm'
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
      />
      <button
        type="button"
        disabled={confirmText !== "DELETE" || busy}
        onClick={() => void deleteAccount()}
        className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Deleting…" : "Delete my account"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
