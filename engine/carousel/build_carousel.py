#!/usr/bin/env python3
"""Build a ClayByte carousel (1080x1350 JPEG slides) from JSON.
usage: python3 -I build_carousel.py CAROUSEL.json OUT_DIR
JSON: {"id","keyword","cover":{"style":"poster|frame","theme":"coral|teal|lilac|sun|ink","series","kicker","title","sub","badge":{"big","small"},"scene":{set,cam,action,props,sets}}, "slides":[...]}
*word* in any title renders as a highlighter mark.
slide types: point{n,title,body} list{title,items} stat{value,label,body} compare{title,left{name,items},right{...},winner}
             quote{text,by} steps{title,items} cta{title,keyword,sub}
             flag{n,label,title,says,fix,says_label,fix_label} recap{title,items,tag}
             doc{title,tag,head,meta,lines:[{k,v,n}],foot}  (paper document mock; lines with "n" get a numbered marker)
             chat{n,label,title,who,status,msgs:[{from:"them"|"you",text}],note}  (DM thread mock: client bubble + your reply script)
             bars{tag,title,rows:[{k,v,pct,note}],foot}  (stage -> value meter rows with big bars)
             table{tag,title,a:{name},b:{name},pick:'a'|'b',rows:[{k,a,b}],foot}  (versus table: attribute rows x 2 columns)
cta.scene{set,cam,action,props,sets} optional: renders the mascot in a window under the CTA text
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
    if t == "flag":  # mistake/red-flag slide: label pill, title, what they say (bubble), your move (fix card)
        lab = f'{E(s.get("label","RED FLAG"))} {E(s.get("n",""))}'.strip()
        says = f'<div class="says"><span>{E(s.get("says_label","THEY SAY"))}</span><p>{E(s.get("says"))}</p></div>' if s.get("says") else ""
        fix = f'<div class="fix"><span>{E(s.get("fix_label","YOUR MOVE"))}</span><p>{E(s.get("fix"))}</p></div>' if s.get("fix") else ""
        return f'<section class="s flag" data-n="{E(s.get("n",""))}"><div class="flab"><i></i>{lab}</div><h2 class="sm">{H(s["title"])}</h2>{says}{fix}{swipe}{foot}</section>'
    if t == "recap":  # cheat-sheet grid before the CTA
        tiles = "".join(f'<div class="tile"><b>{k+1:02d}</b><p>{H(x)}</p></div>' for k, x in enumerate(s.get("items", [])))
        return f'<section class="s dark recap"><div class="rtag">{E(s.get("tag","SCREENSHOT THIS"))}</div><h2 class="sm">{H(s.get("title","Cheat sheet"))}</h2><div class="grid">{tiles}</div>{swipe}{foot}</section>'
    if t == "doc":  # a sendable "screenshot this" document mock (invoice, brief, contract)
        rows = "".join(f'<div class="dl{" hl" if l.get("n") else ""}">{f"<b>{E(l.get(chr(110)))}</b>" if l.get("n") else "<b class=nb></b>"}<span>{E(l.get("k"))}</span><em>{E(l.get("v"))}</em></div>' for l in s.get("lines", []))
        meta = f'<div class="dmeta">{E(s.get("meta"))}</div>' if s.get("meta") else ""
        df = f'<div class="dfoot">{E(s.get("foot"))}</div>' if s.get("foot") else ""
        return f'<section class="s docs"><div class="rtag">{E(s.get("tag","SCREENSHOT THIS"))}</div><h2 class="sm">{H(s.get("title"))}</h2><div class="paper"><div class="dhead">{E(s.get("head","INVOICE"))}</div>{meta}{rows}{df}</div>{swipe}{foot}</section>'
    if t == "chat":  # DM thread mock: what the client sends, the reply you copy
        lab = f'{E(s.get("label","REPLY"))} {E(s.get("n",""))}'.strip()
        bub = "".join(f'<div class="bub {"you" if m.get("from")=="you" else "them"}">{H(m.get("text"))}</div>' for m in s.get("msgs", []))
        note = f'<div class="cnote"><b>WHY IT WORKS</b> {E(s.get("note"))}</div>' if s.get("note") else ""
        return f'''<section class="s chat" data-n="{E(s.get("n",""))}"><div class="clab">{lab}</div><h2 class="sm">{H(s["title"])}</h2>
<div class="phone"><div class="ph"><i>{E((s.get("who","Client") or "C")[0])}</i><div><b>{E(s.get("who","Client"))}</b><span>{E(s.get("status","online"))}</span></div></div>{bub}<div class="seen">Seen ✓✓</div></div>{note}{swipe}{foot}</section>'''
    if t == "bars":  # stage -> value meter rows (e.g. kill fee by project stage); fills the slide with big bars
        rows = "".join(f'<div class="br"><div class="bk"><span>{E(r.get("k"))}</span><b>{E(r.get("v"))}</b></div><div class="bt"><i style="width:{max(4,min(100,float(r.get("pct",0)))):.0f}%"></i></div>{f"<p>{E(r.get(chr(110)+chr(111)+chr(116)+chr(101)))}</p>" if r.get("note") else ""}</div>' for r in s.get("rows", []))
        tag = f'<div class="rtag">{E(s.get("tag"))}</div>' if s.get("tag") else ""
        bf = f'<div class="bfoot">{E(s.get("foot"))}</div>' if s.get("foot") else ""
        return f'<section class="s bars">{tag}<h2 class="sm">{H(s.get("title"))}</h2><div class="brs">{rows}</div>{bf}{swipe}{foot}</section>'
    if t == "check":  # decision scorecard: yes/no questions + a verdict stamp (fit check, "take it or pass")
        def pill(a): a = (a or "").lower(); return f'<em class="{"y" if a=="yes" else "n"}">{"YES" if a=="yes" else "NO"}</em>' if a in ("yes","no") else '<em class="q">?</em>'
        rows = "".join(f'<div class="ck"><b>{k+1}</b><div><span>{H(r.get("q"))}</span>{f"<p>{E(r.get(chr(110)+chr(111)+chr(116)+chr(101)))}</p>" if r.get("note") else ""}</div>{pill(r.get("a"))}</div>' for k, r in enumerate(s.get("rows", [])))
        tag = f'<div class="rtag">{E(s.get("tag"))}</div>' if s.get("tag") else ""
        v = s.get("verdict")
        vd = f'<div class="verdict {E(v.get("mark","pass"))}"><i>{E(v.get("label","VERDICT"))}</i>{H(v.get("text"))}</div>' if v else ""
        return f'<section class="s check">{tag}<h2 class="sm">{H(s.get("title"))}</h2><div class="cks">{rows}</div>{vd}{swipe}{foot}</section>'
    if t == "timeline":  # dated exit/launch plan: vertical rail with "when" pills, a title and one line each; last row = the finish flag
        its = s.get("items", [])
        rows = "".join(f'<div class="tl{" end" if k == len(its)-1 else ""}"><div class="tw">{E(r.get("when"))}</div><i></i><div class="tb"><b>{H(r.get("title"))}</b>{f"<p>{E(r.get(chr(98)+chr(111)+chr(100)+chr(121)))}</p>" if r.get("body") else ""}</div></div>' for k, r in enumerate(its))
        tag = f'<div class="rtag">{E(s.get("tag"))}</div>' if s.get("tag") else ""
        return f'<section class="s tline">{tag}<h2 class="sm">{H(s.get("title"))}</h2><div class="tls">{rows}</div>{swipe}{foot}</section>'
    if t == "table":  # side-by-side versus table: attribute rows x two columns (a/b); "pick" (a|b) highlights one column; optional foot line
        A, B = s.get("a", {}), s.get("b", {}); pk = s.get("pick")
        hd = f'<div class="tr hd"><span></span><b class="{"pk" if pk=="a" else ""}">{E(A.get("name"))}</b><b class="{"pk" if pk=="b" else ""}">{E(B.get("name"))}</b></div>'
        rows = "".join(f'<div class="tr"><span>{E(r.get("k"))}</span><p class="{"pk" if pk=="a" else ""}">{H(r.get("a"))}</p><p class="{"pk" if pk=="b" else ""}">{H(r.get("b"))}</p></div>' for r in s.get("rows", []))
        tag = f'<div class="rtag">{E(s.get("tag"))}</div>' if s.get("tag") else ""
        tf = f'<div class="tfoot">{H(s.get("foot"))}</div>' if s.get("foot") else ""
        return f'<section class="s table">{tag}<h2 class="sm">{H(s.get("title"))}</h2><div class="tbl">{hd}{rows}</div>{tf}{swipe}{foot}</section>'
    if t == "quote":
        return f'<section class="s dark"><div class="q">“</div><h2 class="qt">{E(s["text"])}</h2><p class="by">{E(s.get("by"))}</p>{swipe}{foot}</section>'
    if t == "cta":
        k = E(s.get("keyword", kw))
        if s.get("scene"):
            return f'''<section class="s cta withscene"><h2>{H(s.get("title","Want the free kit?"))}</h2>
{f'<div class="cbox"><i></i><b>{k}</b><span>Post</span></div>' if k else ''}<p class="body">{E(s.get("sub", f"Comment {k} and I'll DM it to you. Follow so the DM lands."))}</p><div class="cwin"><img src="cta.png"></div>{foot}</section>'''
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
    for sl in spec["slides"]:
        if sl.get("type") == "cta" and sl.get("scene"):
            asyncio.run(render_scene(sl["scene"], os.path.join(work, "cta.png")))
    import shutil; shutil.copy(os.path.join(ENG, "avatar.png"), os.path.join(work, "avatar.png"))
    slides = [cover] + spec["slides"]
    if slides[-1].get("type") != "cta": slides.append({"type": "cta", "keyword": spec.get("keyword", "")})
    slides = slides[:10]
    fontdir = "file://" + os.path.join(REEL, "node_modules/@fontsource")
    parts = [slide_html(s, i + 1, len(slides), spec.get("keyword", "")) for i, s in enumerate(slides)]
    if spec.get("seam"):  # one disc split across each slide boundary, so the swipe feels continuous (right half here, left half on the next slide)
        for i in range(1, len(parts) - 1):  # inner slides only (cover and CTA keep their own layout)
            seam = ('<div class="seam l"></div>' if i > 1 else '') + ('<div class="seam r"><span>→</span></div>' if i < len(parts) - 2 else '')
            k = parts[i].rfind("</section>"); parts[i] = parts[i][:k] + seam + parts[i][k:]
    body = "".join(parts)
    page = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS.replace("FONTDIR", fontdir)}</style></head><body>{body}</body></html>'
    files = asyncio.run(shoot(page, out, cid, len(slides)))
    print(json.dumps({"slides": [os.path.basename(f) for f in files]}))

if __name__ == "__main__":
    main()
