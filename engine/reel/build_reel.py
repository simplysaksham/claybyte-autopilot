#!/usr/bin/env python3
"""Build a ClayByte reel from a script JSON.
usage: python3 -I build_reel.py SCRIPT.json OUT_DIR [--stills t1,t2,...] [--workers 2]
Produces OUT_DIR/<id>.mp4 and OUT_DIR/<id>_cover.jpg (or stills only with --stills).
"""
import sys, os, json, subprocess, time, asyncio, shutil, argparse, urllib.request
import numpy as np, soundfile as sf

ENG = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(ENG, "models")
SR = 44100

def ensure_models():
    os.makedirs(MODELS, exist_ok=True)
    base = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
    for f, dst in [("kokoro-v1.0.onnx", "kokoro.onnx"), ("voices-v1.0.bin", "voices.bin")]:
        p = os.path.join(MODELS, dst)
        if not os.path.exists(p) or os.path.getsize(p) < 1_000_000:
            print("downloading", f, flush=True)
            subprocess.run(["curl", "-sSL", "-o", p, base + f], check=True)

def tts(script, work):
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(MODELS, "kokoro.onnx"), os.path.join(MODELS, "voices.bin"))
    voice = script.get("voice", "am_puck"); speed = float(script.get("speed", 1.12))
    voices = script.get("voices", {})
    for i, b in enumerate(script["beats"]):
        v = b.get("voice") or voices.get(b.get("who", "")) or voice
        s, sr = k.create(b["vo"], voice=v, speed=float(b.get("speed", speed)), lang="en-us")
        sf.write(f"{work}/b{i}.wav", s, sr)

def timing(script, work):
    t = 0.0; beats = []
    n = len(script["beats"])
    for i, b in enumerate(script["beats"]):
        a, sr = sf.read(f"{work}/b{i}.wav")
        env = np.abs(a); idx = np.where(env > 0.02 * env.max())[0]; s0, s1 = idx[0] / sr, idx[-1] / sr
        dur = len(a) / sr
        is_cta = (b.get("overlay") or {}).get("type") == "cta"
        duet = script.get("style") == "duet"
        pad = (float(b.get("pad", 0.12 if duet else 0.35))) if i < n - 1 else (1.6 if is_cta else 0.8)
        # per-frame loudness envelope (30 fps) for lip sync
        fr = sr // 30; rms = [float(np.sqrt(np.mean(a[j:j + fr] ** 2))) if j < len(a) else 0.0 for j in range(0, len(a), fr)]
        mx = max(rms) or 1.0; env = [round(min(1.0, x / (mx * .7)), 2) for x in rms]
        if is_cta: dur = max(dur, 3.0)
        toks = b["vo"].split()
        wts = [len(w) + 1.5 + (5 if w[-1] in ".!?" else 2.5 if w[-1] == "," else 0) for w in toks]
        tot = sum(wts); c = s0; words = []
        for w, wt in zip(toks, wts):
            d = (s1 - s0) * wt / tot; core = d * (len(w) + 1.5) / wt
            words.append({"w": w, "t0": round(t + c + .05, 3), "t1": round(t + c + .05 + core, 3)}); c += d
        beat = {k: v for k, v in b.items() if k != "vo"}
        beat.update({"start": round(t, 3), "end": round(t + dur + pad, 3), "words": words, "audio": f"b{i}.wav", "env": env})
        beats.append(beat); t += dur + pad
    T = {"beats": beats, "total": round(t, 3), "keyword": script.get("keyword", ""), "sets": script.get("sets", {}),
         "highlight": script.get("highlight", []), "seed": script.get("seed", 7),
         "style": script.get("style"), "caps": script.get("caps"), "bannerStyle": script.get("banner_style")}
    json.dump(T, open(f"{work}/timing.json", "w"))
    return T

async def render(T, frames_dir, times, workers, port0=8810):
    from playwright.async_api import async_playwright
    open(os.path.join(ENG, "timing.js"), "w").write("window.TIMING=" + json.dumps(T) + ";")
    srv = subprocess.Popen(["python3", "-m", "http.server", str(port0), "-d", ENG], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    os.makedirs(frames_dir, exist_ok=True)
    async def worker(k):
        async with async_playwright() as p:
            b = await p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
            pg = await b.new_page(viewport={"width": 720, "height": 1280})
            errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(f"http://localhost:{port0}/index.html")
            try:
                await pg.wait_for_function("window.renderAt && window.READY", timeout=90000)
            except Exception:
                raise RuntimeError("page failed to load: " + "; ".join(errs))
            for j, (i, t) in enumerate(times):
                if j % workers != k: continue
                f = f"{frames_dir}/f{i:05d}.jpg"
                if os.path.exists(f): continue
                await pg.evaluate(f"renderAt({t})"); await pg.screenshot(path=f, quality=92, type="jpeg")
            if errs: print("PAGE ERRORS:", errs[:3], flush=True)
            await b.close()
    try:
        await asyncio.gather(*[worker(k) for k in range(workers)])
    finally:
        srv.terminate()

# ---------- audio ----------
rng = np.random.default_rng(3)
def _add(buf, sig, t, g=1.0):
    i = int(t * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf): buf[i:j] += sig[:j - i] * g
def tone(f, d, dec=6, h=(1, .35, .12)):
    t = np.arange(int(d * SR)) / SR; return sum(a * np.sin(2 * np.pi * f * (k + 1) * t) for k, a in enumerate(h)) * np.exp(-dec * t) * np.minimum(1, t * 400)
def noise(d, dec=20): t = np.arange(int(d * SR)) / SR; return rng.standard_normal(len(t)) * np.exp(-dec * t)
def onepole(x, a):
    from scipy.signal import lfilter
    return lfilter([a], [1, -(1 - a)], x)
def hp(x, a=.15): return x - onepole(x, a)
mid = lambda m: 440 * 2 ** ((m - 69) / 12)
def whoosh(d=.35):
    n = rng.standard_normal(int(d * SR)); t = np.arange(len(n)) / SR; return onepole(n, .12) * np.sin(np.pi * t / d) ** 2
def pop(f=900): t = np.arange(int(.09 * SR)) / SR; return np.sin(2 * np.pi * (f * (1 + 2 * np.exp(-60 * t))) * t) * np.exp(-45 * t)
def ding(f): return tone(f, .9, 4.5, (1, 0, .25, 0, .1))
def thud(): t = np.arange(int(.25 * SR)) / SR; return np.sin(2 * np.pi * (80 + 120 * np.exp(-25 * t)) * t) * np.exp(-14 * t) + onepole(noise(.25, 30), .1) * .5
def click(): return hp(noise(.02, 250), .6)

PROGS = [([60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]), ([62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 60, 64]), ([57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62])]
def mix(T, work, out_wav, seed=0):
    N = int((T["total"] + .3) * SR); music = np.zeros(N); sfx = np.zeros(N); voice = np.zeros(N)
    prog = PROGS[seed % len(PROGS)]; bpm = [104, 98, 110][seed % 3]; b = 60 / bpm
    t = np.arange(int(.35 * SR)) / SR; kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-30 * t)) * t) * np.exp(-9 * t)
    shk = hp(noise(.08, 60), .5); tt = 0.0; bar = 0; pat = [[0, 1, 2, 1, 0, 2, 1, 2], [0, 2, 1, 2, 0, 1, 2, 1], [2, 1, 0, 1, 2, 0, 1, 0]][seed % 3]
    while tt < T["total"] + 1:
        c = prog[bar % 4]
        for k in range(8): _add(music, tone(mid(c[pat[k]] + 12), .5, 9, (1, .25, .08)), tt + k * b / 2, .16)
        _add(music, tone(mid(c[0] - 24), b * 4, 1.6, (1, .5, .2)), tt, .30)
        for c2 in c: _add(music, tone(mid(c2), b * 4, 1.2, (1, .15)), tt, .05)
        for k in range(4):
            if k % 2 == 0: _add(music, kick, tt + k * b, .45)
            _add(music, shk, tt + k * b + b / 2, .10); _add(music, shk, tt + k * b + b * .75, .05)
        tt += 4 * b; bar += 1
    for i, B in enumerate(T["beats"]):
        s, D = B["start"], B["end"] - B["start"]; ps = B.get("props", []); o = B.get("overlay") or {}
        if i: _add(sfx, whoosh(), s - .18, .35)
        if "press" in ps: _add(sfx, click(), s + .55, .6); _add(sfx, pop(500), s + .6, .5)
        if "paperBurst" in ps:
            for k in range(0, 46, 3): _add(sfx, pop(700 + int(rng.integers(0, 500))), s + .6 + k * .055, .12)
        if "pile" in ps:
            for k in range(0, 230, 8): _add(sfx, pop(600 + int(rng.integers(0, 700))), s + (k / 230) * D * .85 + .3, .08)
        if "coins" in ps:
            for k in range(14): _add(sfx, tone(2600 + 300 * (k % 3), .15, 30, (1, .4)), s + .9 + k * .12, .12)
        if "confetti" in ps: _add(sfx, hp(noise(.5, 6), .3), s + .2, .15)
        if "belt" in ps:
            for k, it in enumerate(B.get("belt", [])):
                if it.get("score", 0) < 7: _add(sfx, thud(), s + (4.8 + 1.25 * k) / 1.5, .45)
                else: _add(sfx, ding(mid(84)), s + (6.7 + 1.25 * k) / 1.5, .18)
        if o.get("type") in ("chips", "checklist", "card"):
            n = len(o.get("items", []))
            for k in range(n): _add(sfx, ding(mid([72, 74, 76, 79, 81, 84, 86][k % 7])), s + .6 + k * (D - 1.2) / max(1, n), .2)
        if o.get("type") in ("bigstat", "score"): _add(sfx, pop(1200), s + .25, .4)
        if o.get("type") in ("pill", "bigcount") and o.get("to", 0) != o.get("from", 0):
            du = o.get("dur", max(.6, D * .55)); st = o.get("at", .25)
            for k in range(int(du / .06)): _add(sfx, click(), s + st + k * .06, .18)
            _add(sfx, ding(mid(91)), s + st + du, .3)
        if o.get("type") == "grid":
            n = o.get("n", 24); du = o.get("dur", D * .7)
            for k in range(0, n, 2): _add(sfx, pop(900 + 40 * (k % 9)), s + .2 + k / n * du, .12)
        if o.get("type") == "stamp": _add(sfx, thud(), s + o.get("at", .3) + .1, .7)
        if o.get("type") == "phone": _add(sfx, whoosh(.3), s + .05, .3)
        if o.get("type") == "cta":
            for k in range(4): _add(sfx, click(), s + .5 + k * .2, .5)
            _add(sfx, pop(1100), s + 1.6, .4); _add(sfx, ding(mid(88)), s + 1.85, .3); _add(sfx, pop(1400), s + 2.3, .35)
        a, sr = sf.read(f"{work}/{B['audio']}")
        if sr != SR: a = np.interp(np.arange(0, len(a) * SR / sr) * sr / SR, np.arange(len(a)), a)
        _add(voice, a, s + .05)
    env = np.convolve(np.abs(voice), np.ones(4410) / 4410, "same"); duck = 1 - .55 * np.clip(env / (env.max() * .15 + 1e-9), 0, 1)
    duck = np.convolve(duck, np.ones(8820) / 8820, "same")
    fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl)
    m = voice + music * duck * .55 * fade + sfx * .8; m /= np.abs(m).max() * 1.05
    sf.write(out_wav, m, SR)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("script"); ap.add_argument("out"); ap.add_argument("--stills"); ap.add_argument("--workers", type=int, default=2)
    a = ap.parse_args()
    script = json.load(open(a.script)); rid = script.get("id", "reel")
    os.makedirs(a.out, exist_ok=True); work = os.path.join(a.out, rid + "_work"); os.makedirs(work, exist_ok=True)
    ensure_models(); tts(script, work); T = timing(script, work)
    print(f"{rid}: {T['total']:.1f}s, {len(T['beats'])} beats", flush=True)
    if a.stills:
        ts = [float(x) for x in a.stills.split(",")]
        asyncio.run(render(T, work + "/stills", [(i, t) for i, t in enumerate(ts)], 1)); print("stills in", work + "/stills"); return
    n = int(T["total"] * 30); t0 = time.time()
    asyncio.run(render(T, work + "/frames", [(i, i / 30) for i in range(n)], a.workers))
    print(f"rendered {n} frames in {time.time() - t0:.0f}s", flush=True)
    mix(T, work, work + "/mix.wav", seed=script.get("seed", 0))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", work + "/mix.wav", "-af", "loudnorm=I=-15:TP=-1.0:LRA=11", "-ar", "48000", work + "/mix_n.wav"], check=True)
    mp4 = os.path.join(a.out, rid + ".mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", work + "/frames/f%05d.jpg", "-i", work + "/mix_n.wav",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-tune", "grain", "-maxrate", "8M", "-bufsize", "16M", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", mp4], check=True)
    ci = script.get("cover_beat", 0); cb = T["beats"][min(ci, len(T["beats"]) - 1)]
    cf = int(((cb["start"] + cb["end"]) / 2) * 30); shutil.copy(f"{work}/frames/f{cf:05d}.jpg", os.path.join(a.out, rid + "_cover.jpg"))
    shutil.rmtree(work + "/frames", ignore_errors=True)
    print("done", mp4, os.path.getsize(mp4) // 1024, "KB", flush=True)

if __name__ == "__main__":
    main()
