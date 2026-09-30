import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.105.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function defaultKeyFromJson(name: string): string | null {
  const raw = Deno.env.get(name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey =
    defaultKeyFromJson("SUPABASE_PUBLISHABLE_KEYS") ??
    Deno.env.get("SUPABASE_ANON_KEY") ??
    null;
  const secretKey =
    defaultKeyFromJson("SUPABASE_SECRET_KEYS") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    null;

  if (!supabaseUrl || !publishableKey || !secretKey) {
    console.error("[delete-account] Missing default Supabase function secrets");
    return json({ error: "Account deletion backend is not configured" }, 503);
  }

  const token = authHeader.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: imageRows, error: imageError } = await admin
    .from("scan_images")
    .select("storage_path")
    .eq("user_id", user.id);

  if (imageError) {
    console.error("[delete-account] Could not read image paths:", imageError.message);
    return json({ error: "Could not prepare account deletion" }, 500);
  }

  const paths = (imageRows ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => typeof path === "string" && path.length > 0);

  if (paths.length > 0) {
    const { error: storageError } = await admin.storage
      .from("scan-images")
      .remove(paths);

    if (storageError) {
      console.error("[delete-account] Storage cleanup failed:", storageError.message);
      return json({ error: "Could not delete uploaded comic images" }, 500);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("[delete-account] Auth user deletion failed:", deleteError.message);
    return json({ error: "Could not delete account" }, 500);
  }

  return json({ ok: true });
});
