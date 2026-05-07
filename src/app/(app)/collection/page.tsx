import { SlabCard } from "@/components/slab-card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CollectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans } = await supabase
    .from("comic_scans")
    .select("id,title,status,created_at,user_saved_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Collection
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
            Scan history
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Every submission lives here with status, timestamps, and links back
            to your predicted grade ranges.
          </p>
        </div>
        <Link
          href="/scans/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-400 px-6 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
        >
          New scan
        </Link>
      </div>

      <SlabCard label="All scans">
        {!scans?.length ? (
          <p className="text-sm text-zinc-400">
            Your scans will appear here after your first upload.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="pb-3 pr-6 font-medium">Title</th>
                  <th className="pb-3 pr-6 font-medium">Status</th>
                  <th className="pb-3 pr-6 font-medium">Saved</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 pl-6 font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {scans.map((row) => (
                  <tr key={row.id} className="text-zinc-200">
                    <td className="py-4 pr-6 font-medium">{row.title}</td>
                    <td className="py-4 pr-6 capitalize text-zinc-400">
                      {row.status}
                    </td>
                    <td className="py-4 pr-6 text-zinc-400">
                      {row.user_saved_at ? "Yes" : "—"}
                    </td>
                    <td className="py-4 text-zinc-400">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-4 pl-6 text-right">
                      <Link
                        href={`/scans/${row.id}`}
                        className="font-semibold text-amber-400 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SlabCard>
    </div>
  );
}
