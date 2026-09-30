import { DeleteAccountButton } from "@/components/account/DeleteAccountButton";
import { SlabCard } from "@/components/slab-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Account</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Account & privacy</h1>
        <p className="mt-3 text-sm text-zinc-400">{user.email ?? "Signed-in CoverGrail account"}</p>
      </div>
      <SlabCard label="Delete account">
        <DeleteAccountButton />
      </SlabCard>
    </div>
  );
}
