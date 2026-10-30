#!/usr/bin/env python3
"""Build a ClayByte carousel (1080x1350 JPEG slides) from JSON.
usage: python3 -I build_carousel.py CAROUSEL.json OUT_DIR
JSON: {"id","keyword","cover":{"style":"poster|frame","theme":"coral|teal|lilac|sun|ink","series","kicker","title","sub","badge":{"big","small"},"scene":{set,cam,action,props,sets}}, "slides":[...]}
*word* in any title renders as a highlighter mark.
slide types: point{n,title,body} list{title,items} stat{value,label,body} compare{title,left{name,items},right{...},winner}
             quote{text,by} steps{title,items} cta{title,keyword,sub}
"""
import sys, os, json, asyncio, subprocess, time, html, re
ENG = os.path.dirname(os.path.abspath(__file__)); REEL = os.path.join(os.path.dirname(ENG), "reel")
E = lambda s: html.escape(str(s or ""))
# *word* -> highlighter mark; used in titles
H = lambda s: re.sub(r"\*(.+?)\*", r"<mark>\1</mark>", E(s))
THEMES = {  # bg, text, highlight pill, text on pill
    "coral": ("#E8664A", "#FFF3DC", "#F2B33D", "#2A1F33"), "teal": ("#36B5A0", "#FFF3DC", "#2A1F33", "#F2B33D"),
    "lilac": ("#B6A2E3", "#2A1F33", "#E8664A", "#FFF3DC"), "sun": ("#F2B33D", "#2A1F33", "#2A1F33", "#F2B33D"),
    "ink": ("#2A1F33", "#FFF3DC", "#F2B33D", "#2A1F33")}

async def render_scene(scene, out_png, port=8830):
    from playwright.async_api import async_playwright
    beat = {"banner": "", "set": scene.get("set", "machine"), "cam": scene.get("cam", "wide"), "mascot": {"action": scene.get("action", "wave")},
            "props": scene.get("props", []), "overlay": {"type": "none"}, "start": 0, "end": 10, "words": []}
    for k in ("cards", "belt"):
        if k in scene: beat[k] = scene[k]
    T = {"beats": [beat], "total": 10, "sets": scene.get("sets", {}), "still": True, "seed": 3}
    open(os.path.join(REEL, "timing.js"), "w").write("window.TIMING=" + json.dumps(T) + ";")
    srv = subprocess.Popen(["python3", "-m", "http.server", str(port), "-d", REEL], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await b.new_page(viewport={"width": 720, "height": 1280}, device_scale_factor=1.5)
            await pg.goto(f"http://localhost:{port}/index.html"); await pg.wait_for_function("window.renderAt && window.READY", timeout=90000)
            await pg.evaluate(f"renderAt({scene.get('t', 2.2)})"); await pg.screenshot(path=out_png, type="png"); await b.close()
    finally:
        srv.terminate()

CSS = open(os.path.join(ENG, "style.css")).read()

def slide_html(s, i, n, kw):
    t = s.get("type")
    foot = f'<div class="foot"><span class="me"><img src="avatar.png">@claybyte.in</span><span>{i}/{n}</span></div><div class="prog"><i style="width:{i/n*100:.1f}%"></i></div>'
    swipe = '<div class="swipe">SWIPE →</div>' if i < n else ''
    if t == "cover":
        bg, fg, acc, acct = THEMES.get(s.get("theme", "coral"), THEMES["coral"])
        style = s.get("style", "poster")
        series = f'<div class="series">{E(s.get("series"))}</div>' if s.get("series") else ""
        b = s.get("badge")
        badge = f'<div class="badge"><b>{E(b.get("big"))}</b><span>{E(b.get("small"))}</span></div>' if b else ""
        sub = f'<p>{E(s.get("sub"))}</p>' if s.get("sub") else ""
        txt = f'<div class="ctxt">{series}<div class="kick">{E(s.get("kicker","SAVE THIS"))}</div><h1>{H(s["title"])}</h1>{sub}</div>'
        arrow = '<div class="arrow"><svg viewBox="0 0 120 60"><path d="M6 40 C 40 0, 80 0, 104 30" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><path d="M84 30 L106 32 L100 10" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg><span>SWIPE</span></div>'
        return f'''<section class="s cover {style}" style="--bg:{bg};--fg:{fg};--acc:{acc};--acct:{acct}">{txt}<div class="win"><img src="cover.png"></div>{badge}{arrow}<div class="handle"><img src="avatar.png">@claybyte.in</div></section>'''
    if t == "point":
        return f'<section class="s"><div class="num">{E(s.get("n", i-1))}</div><h2>{H(s["title"])}</h2><p class="body">{E(s.get("body"))}</p>{swipe}{foot}</section>'
    if t in ("list", "steps"):
        li = "".join(f'<li><b>{k+1}</b><span>{E(x)}</span></li>' for k, x in enumerate(s.get("items", [])))
        return f'<section class="s"><h2 class="sm">{H(s["title"])}</h2><ol class="lst">{li}</ol>{swipe}{foot}</section>'
    if t == "stat":
        return f'<section class="s"><div class="stat">{E(s["value"])}</div><div class="slab">{E(s.get("label"))}</div><p class="body">{E(s.get("body"))}</p>{swipe}{foot}</section>'
    if t == "compare":
        def col(c, w): return f'<div class="col {"win" if w else ""}">{"<em>WINNER</em>" if w else ""}<h3>{E(c.get("name"))}</h3>' + "".join(f"<p>{E(x)}</p>" for x in c.get("items", [])) + '</div>'
        return f'<section class="s"><h2 class="sm">{H(s.get("title"))}</h2><div class="cmp">{col(s["left"], s.get("winner")=="left")}{col(s["right"], s.get("winner")=="right")}</div>{swipe}{foot}</section>'
    if t == "quote":
        return f'<section class="s dark"><div class="q">“</div><h2 class="qt">{E(s["text"])}</h2><p class="by">{E(s.get("by"))}</p>{swipe}{foot}</section>'
    if t == "cta":
        k = E(s.get("keyword", kw))
        return f'''<section class="s cta"><h2>{H(s.get("title","Want the free kit?"))}</h2>
{f'<div class="cbox"><i></i><b>{k}</b><span>Post</span></div>' if k else ''}<p class="body">{E(s.get("sub", f"Comment {k} and I'll DM it to you. Follow so the DM lands."))}</p>{foot}</section>'''
    raise ValueError("unknown slide type " + str(t))

async def shoot(page_html, out_dir, cid, n):
    from playwright.async_api import async_playwright
    p_html = os.path.join(out_dir, cid + "_work", "slides.html"); open(p_html, "w").write(page_html)
    files = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1080, "height": 1350})
        await pg.goto("file://" + p_html); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(400)
        for i in range(n):
            el = (await pg.query_selector_all("section.s"))[i]
            f = os.path.join(out_dir, f"{cid}_{i+1:02d}.jpg"); await el.screenshot(path=f, type="jpeg", quality=92); files.append(f)
        await b.close()
    return files

def main():
    spec = json.load(open(sys.argv[1])); out = os.path.abspath(sys.argv[2]); cid = spec.get("id", "carousel")
    work = os.path.join(out, cid + "_work"); os.makedirs(work, exist_ok=True)
    cover = dict(spec["cover"]); cover["type"] = "cover"
    cover.setdefault("scene", {}).setdefault("cam", "close")
    asyncio.run(render_scene(cover.get("scene", {}), os.path.join(work, "cover.png")))
    import shutil; shutil.copy(os.path.join(ENG, "avatar.png"), os.path.join(work, "avatar.png"))
    slides = [cover] + spec["slides"]
    if slides[-1].get("type") != "cta": slides.append({"type": "cta", "keyword": spec.get("keyword", "")})
    slides = slides[:10]
    fontdir = "file://" + os.path.join(REEL, "node_modules/@fontsource")
    body = "".join(slide_html(s, i + 1, len(slides), spec.get("keyword", "")) for i, s in enumerate(slides))
    page = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS.replace("FONTDIR", fontdir)}</style></head><body>{body}</body></html>'
    files = asyncio.run(shoot(page, out, cid, len(slides)))
    print(json.dumps({"slides": [os.path.basename(f) for f in files]}))

if __name__ == "__main__":
    main()
