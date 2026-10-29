#!/usr/bin/env python3
"""Build all media for one day's plan and stage it for GitHub Pages.
usage: python3 -I pipeline/run_daily.py PLAN.json SITE_DIR MEDIA_BASE_URL
- builds each item (reels ~25 min each, carousel ~1 min)
- copies outputs into SITE_DIR/<date>/
- writes SITE_DIR/<date>/manifest.json and prints SQL to queue the posts (times from plan[...]["publish_at"])
"""
import sys, os, json, subprocess, shutil, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan = json.load(open(sys.argv[1])); site = os.path.abspath(sys.argv[2]); base = sys.argv[3].rstrip("/")
date = plan["date"]; out = os.path.join(site, date); os.makedirs(out, exist_ok=True)
build = os.path.join(ROOT, "build", date); os.makedirs(build, exist_ok=True)
rows = []

def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"

for it in plan["items"]:
    kind = it["kind"]
    if kind == "reel":
        sp = os.path.join(build, it["script"]["id"] + ".json"); json.dump(it["script"], open(sp, "w"))
        r = subprocess.run(["python3", "-I", os.path.join(ROOT, "engine/reel/build_reel.py"), sp, build], capture_output=True, text=True)
        print(r.stdout[-800:], r.stderr[-800:], flush=True)
        if r.returncode: print("FAILED", it["script"]["id"]); continue
        rid = it["script"]["id"]
        shutil.copy(os.path.join(build, rid + ".mp4"), out); shutil.copy(os.path.join(build, rid + "_cover.jpg"), out)
        media = [f"{base}/{date}/{rid}.mp4"]; cover = f"{base}/{date}/{rid}_cover.jpg"
    elif kind == "carousel":
        sp = os.path.join(build, it["spec"]["id"] + ".json"); json.dump(it["spec"], open(sp, "w"))
        r = subprocess.run(["python3", "-I", os.path.join(ROOT, "engine/carousel/build_carousel.py"), sp, build], capture_output=True, text=True)
        print(r.stdout[-800:], r.stderr[-800:], flush=True)
        if r.returncode: print("FAILED", it["spec"]["id"]); continue
        files = json.loads(r.stdout.strip().splitlines()[-1])["slides"]
        for f in files: shutil.copy(os.path.join(build, f), out)
        media = [f"{base}/{date}/{f}" for f in files]; cover = None
    else:
        continue
    rows.append({"kind": kind, "title": it.get("topic"), "caption": it["caption"], "media_urls": media, "cover_url": cover,
                 "keyword": it.get("keyword"), "publish_at": it["publish_at"], "topic": it.get("topic"), "pillar": it.get("pillar")})

json.dump({"date": date, "rows": rows}, open(os.path.join(out, "manifest.json"), "w"), indent=1)
open(os.path.join(site, ".nojekyll"), "w").write("")
sql = []
for r in rows:
    sql.append("with p as (insert into public.posts(kind,title,caption,media_urls,cover_url,keyword,publish_at) values ("
               f"{q(r['kind'])},{q(r['title'])},{q(r['caption'])},{q(json.dumps(r['media_urls']))}::jsonb,{q(r['cover_url'])},{q(r['keyword'])},{q(r['publish_at'])}::timestamptz) returning id) "
               f"insert into public.topics_log(topic,kind,keyword,post_id) select {q(r['topic'])},{q(r['kind'])},{q(r['keyword'])},id from p;")
open(os.path.join(build, "queue.sql"), "w").write("\n".join(sql))
print("QUEUE_SQL", os.path.join(build, "queue.sql"))
print(f"built {len(rows)}/{len(plan['items'])} items")
