// ClayByte autopilot: publishes due posts from public.posts to Instagram.
// Called every 5 minutes by pg_cron with header x-cron-secret.
// State machine: queued -> processing (container created) -> published | failed
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MAX_ATTEMPTS = 3;
const PROCESSING_TIMEOUT_MIN = 60;

async function cfg(key: string) {
  const { data } = await sb.from("config").select("value").eq("key", key).single();
  return data?.value as string | undefined;
}

type Auth = { ig_user_id: string; access_token: string };

async function ig(auth: Auth, ver: string, path: string, method: "GET" | "POST", params: Record<string, string> = {}) {
  const url = new URL(`https://graph.instagram.com/${ver}/${path}`);
  const body = new URLSearchParams({ ...params, access_token: auth.access_token });
  let res: Response;
  if (method === "GET") {
    body.forEach((v, k) => url.searchParams.set(k, v));
    res = await fetch(url);
  } else {
    res = await fetch(url, { method: "POST", body });
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`${path}: ${JSON.stringify(json.error ?? json).slice(0, 400)}`);
  return json;
}

async function createContainer(auth: Auth, ver: string, p: any): Promise<string> {
  const urls: string[] = p.media_urls;
  if (p.kind === "reel") {
    const params: Record<string, string> = { media_type: "REELS", video_url: urls[0], caption: p.caption, share_to_feed: "true" };
    if (p.cover_url) params.cover_url = p.cover_url;
    return (await ig(auth, ver, `${auth.ig_user_id}/media`, "POST", params)).id;
  }
  if (p.kind === "image") {
    return (await ig(auth, ver, `${auth.ig_user_id}/media`, "POST", { image_url: urls[0], caption: p.caption })).id;
  }
  // carousel
  const children: string[] = [];
  for (const u of urls.slice(0, 10)) {
    const isVid = /\.(mp4|mov)(\?|$)/i.test(u);
    const params: Record<string, string> = { is_carousel_item: "true", ...(isVid ? { media_type: "VIDEO", video_url: u } : { image_url: u }) };
    children.push((await ig(auth, ver, `${auth.ig_user_id}/media`, "POST", params)).id);
  }
  return (await ig(auth, ver, `${auth.ig_user_id}/media`, "POST", { media_type: "CAROUSEL", children: children.join(","), caption: p.caption })).id;
}

async function update(id: number, fields: Record<string, unknown>) {
  await sb.from("posts").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
}

Deno.serve(async (req) => {
  const secret = await cfg("cron_secret");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return new Response("forbidden", { status: 403 });
  if ((await cfg("paused")) === "true") return Response.json({ paused: true });

  const ver = (await cfg("graph_version")) ?? "v26.0";
  const { data: a } = await sb.from("ig_auth").select("ig_user_id,access_token").eq("id", 1).single();
  if (!a?.access_token || !a?.ig_user_id) return Response.json({ error: "no instagram token yet" }, { status: 200 });
  const auth = a as Auth;
  const log: unknown[] = [];

  // 1) advance processing containers
  const { data: proc } = await sb.from("posts").select("*").eq("status", "processing").limit(10);
  for (const p of proc ?? []) {
    try {
      const st = await ig(auth, ver, p.container_id, "GET", { fields: "status_code,status" });
      if (st.status_code === "FINISHED") {
        const pub = await ig(auth, ver, `${auth.ig_user_id}/media_publish`, "POST", { creation_id: p.container_id });
        let permalink: string | null = null;
        try { permalink = (await ig(auth, ver, pub.id, "GET", { fields: "permalink" })).permalink; } catch (_) { /* optional */ }
        await update(p.id, { status: "published", ig_media_id: pub.id, permalink, error: null });
        log.push({ id: p.id, published: pub.id });
      } else if (st.status_code === "ERROR" || st.status_code === "EXPIRED") {
        throw new Error(`container ${st.status_code}: ${st.status ?? ""}`);
      } else {
        const age = (Date.now() - new Date(p.updated_at).getTime()) / 60000;
        if (age > PROCESSING_TIMEOUT_MIN) throw new Error("processing timeout");
        log.push({ id: p.id, waiting: st.status_code });
      }
    } catch (e) {
      const attempts = p.attempts + 1;
      await update(p.id, { status: attempts >= MAX_ATTEMPTS ? "failed" : "queued", container_id: null, attempts, error: String(e).slice(0, 800) });
      log.push({ id: p.id, error: String(e) });
    }
  }

  // 2) start due posts (max 2 per run to stay gentle)
  const { data: due } = await sb.from("posts").select("*").eq("status", "queued")
    .lte("publish_at", new Date().toISOString()).order("publish_at").limit(2);
  for (const p of due ?? []) {
    try {
      const cid = await createContainer(auth, ver, p);
      await update(p.id, { status: "processing", container_id: cid });
      log.push({ id: p.id, container: cid });
    } catch (e) {
      const attempts = p.attempts + 1;
      await update(p.id, { status: attempts >= MAX_ATTEMPTS ? "failed" : "queued", attempts, error: String(e).slice(0, 800) });
      log.push({ id: p.id, error: String(e) });
    }
  }
  return Response.json({ ok: true, log });
});
