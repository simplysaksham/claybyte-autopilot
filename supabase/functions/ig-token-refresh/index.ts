// Refreshes the long-lived Instagram token (valid 60 days). Called weekly by pg_cron.
import { createClient } from "npm:@supabase/supabase-js@2";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const { data: s } = await sb.from("config").select("value").eq("key", "cron_secret").single();
  if (!s || req.headers.get("x-cron-secret") !== s.value) return new Response("forbidden", { status: 403 });
  const { data: h } = await sb.from("config").select("value").eq("key", "graph_host").single();
  if (h?.value === "graph.facebook.com") return Response.json({ ok: true, skipped: "page tokens from long-lived user tokens do not expire" });
  const { data: a } = await sb.from("ig_auth").select("access_token").eq("id", 1).single();
  if (!a?.access_token) return Response.json({ error: "no token" });
  const u = new URL("https://graph.instagram.com/refresh_access_token");
  u.searchParams.set("grant_type", "ig_refresh_token");
  u.searchParams.set("access_token", a.access_token);
  const r = await fetch(u);
  const j = await r.json();
  if (!r.ok || !j.access_token) return Response.json({ error: j.error ?? j }, { status: 500 });
  await sb.from("ig_auth").update({
    access_token: j.access_token,
    expires_at: new Date(Date.now() + j.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return Response.json({ ok: true, expires_in: j.expires_in });
});
