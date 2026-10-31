# ClayByte Autopilot — content spec

Instagram page: **ClayByte**. Niche: **AI + creator/agency life**, English only, soft clay/toy 3D look, mascot **Byte** (teal clay blob with antenna). Global audience, Indian founder.

Daily output (for the NEXT day, IST):
| Slot | Kind | Time (IST) |
|---|---|---|
| 1 | carousel (6–9 slides) | 10:00 |
| 2 | reel (20–35 s) | 13:30 |
| 3 | reel (20–35 s) | 19:30 |

Times live in `config.post_times` in Supabase (JSON) and override this table.

## Content pillars (rotate; never the same pillar twice in one day)
1. **AI tools & Claude workflows** for creators (skills, prompts, automations). Free resource CTA.
2. **Hooks, scripting & editing** craft.
3. **Agency / client life** (pricing, briefs, ghosting clients, retainers).
4. **Creator money** (brand deals, rate cards, digital products).
5. **Mindset & systems** (burnout, consistency, batching).

Formats that work (from analysis of top reels in this style): big number hook in first 2 s, a "villain" (pain), 3–4 numbered mechanism beats, a payoff stat, a twist, "it's free", comment CTA.

## Hard rules (quality + safety)
- No invented statistics. Numbers must be either (a) obviously illustrative ("say you post 3x a week"), (b) the user's own process numbers, or (c) verified with a web search THIS session; keep the source URL in the plan file.
- Any claim about a specific product (price, feature, plan) must be web-verified this session. If unsure, don't name the product.
- No real people's names, faces or likeness. No brand logos. No copyrighted characters.
- No "guaranteed results", no fake urgency, no fake testimonials.
- Every reel must teach or deliver something concrete. No vague motivation filler.
- Do not repeat a topic logged in `topics_log` in the last 60 days. Check before planning.
- CTA keyword must be one of the live SuperProfile keywords in `config.dm_keywords`. If none fits, use a soft CTA ("Follow for daily AI creator tips", "Save this") and leave keyword null.
- Captions: first line = hook or "Comment KEYWORD and I'll DM you…". 4–7 hashtags. Under 1,500 characters.

## Reel script JSON (engine/reel/build_reel.py)
```json
{
  "id": "2026-10-31-r1",
  "keyword": "IDEA",
  "voice": "am_puck",          // kokoro voices: am_puck, am_michael, am_fenrir, af_heart, af_bella
  "speed": 1.12,
  "seed": 3,                    // varies music progression/tempo (0,1,2...)
  "highlight": ["IDEA", "thirty"],  // caption words shown in yellow
  "cover_beat": 0,
  "sets": {                     // optional per-set customisation
    "machine": {"sign": "IDEAS", "wall": "#B6A2E3"},
    "desk": {"phone": {"app": "Notes", "title": "Reel ideas", "lines": ["No notes"], "pill": "0 ideas"}},
    "studio": {"laptop": {"title": "claude", "lines": ["> prompt here", "answer here"]}},
    "conveyor": {"poster": {"title": "HOOK SCORE", "big": "7+", "sub": "OR IT GOES IN THE BIN"}, "keep": "KEEP"},
    "stage": {}
  },
  "beats": [
    {"banner": "≤ 30 CHARS, CAPS", "vo": "One or two short spoken sentences.",
     "set": "machine|desk|conveyor|stage|studio", "cam": "wide|close|low|side",
     "mascot": {"action": "idle|hop|wave|sad|celebrate|point|think|shock|type|press|throw", "hide": false},
     "props": ["paperBurst","pile","coins","confetti","rain","bulb","trophy","bulbs","press","cards","belt"],
     "cards": ["NICHE","AUDIENCE","LAST 10|POSTS"],      // with "cards" prop (machine set)
     "belt": [{"score":9},{"score":4},{"score":8,"label":"8/10"}], // with "belt" prop (conveyor set)
     "overlay": {"type": "none|chips|counter|bigstat|card|terminal|compare|score|checklist|cta", ...}
    }
  ]
}
```
Overlay fields: chips `{items:[≤7 short]}` · counter `{label,from,to,prefix,suffix}` · bigstat `{value,label}` · card `{title,items:[≤4]}` · terminal `{lines:[{role:"you"|"ai",text}]}` · compare `{left:{name,items},right:{name,items},winner:"left"|"right"}` · score `{value,max}` · checklist `{items:[≤5]}` · cta `{keyword, follow}`.

Rules of thumb:
- 6–8 beats, 20–35 s total. Beat VO 6–18 words. First beat = hook with a number or a villain.
- Change set or camera every beat; reuse sets but vary cam. Max 2 beats per set per reel.
- `bulbs`/`press`/`cards`/`paperBurst` only make sense on the machine set; `belt` only on conveyor.
- Overlays sit in the upper half (y 220–700 px); keep text short (they're read in 3 s).
- Last beat: `overlay.type = "cta"` if a keyword is used, else a `card` with the soft CTA.
- `chips`/`checklist` items: put the spoken word first so the pop syncs with the voice.

## Duet reels (two-character story format) — preferred for at least one reel a day
Modelled on a high-performing reference (analysed 2026-10-31): a struggling creator talks to an AI sidekick; pain → proof → "show me" → numbered steps → objection → payoff → CTA.
Characters: **Pip** (original clay creator: coral hoodie, lilac beanie) and **Byte** (the AI helper). Set: `night` (navy void, bokeh, neon grid floor).
```json
{"id":"…","style":"duet","caps":"bold","banner_style":"chip","voices":{"pip":"am_puck","byte":"af_heart"},"speed":1.12,"seed":2,
 "highlight":["six","IDEA"],"sets":{"night":{}},
 "beats":[{"who":"pip","set":"night","cam":"pip","banner":"3:12 AM","vo":"Byte. My last reel got six views.","pip":{"action":"sad"},
           "overlay":{"type":"pill","label":"YOUR LAST REEL","from":6,"to":6,"suffix":" views"}},
          {"who":"byte","set":"night","cam":"byte","banner":"STEP 1 · *PASTE*","step":[1,3],"vo":"…","mascot":{"action":"point"}}]}
```
- One line per beat (3–12 words), `who` = speaker (lip-synced from the audio). Alternate speakers; 12–16 beats, 35–50 s.
- Cams on `night`: `pip` / `byte` (face close-ups for emotion), `two` (both, medium), `wide`, `close` (medium centre), `side` (over Pip's shoulder), `low`. Change cam every beat; use face close-ups for reactions.
- Pip actions: talk (default when speaking), listen (default otherwise), sad, shock, think, point, wave, celebrate, facepalm, type (holds a laptop).
- `banner_style:"chip"`: banner is a small header; `*word*` turns yellow; `step:[i,n]` adds progress dashes. Keep the same banner for a section ("STEP 2 · *SCORE*").
- `caps:"bold"`: 3-word white captions with yellow keywords and numbers.
- New overlays: `pill` {label,from,to,suffix,compact,log} (views pill that counts up) · `bigcount` {label,from,to,prefix,suffix,of,unit,bar,sub,log} · `grid` {n,cols,label} (thumbnails filling in) · `stamp` {text,mark:"x"|"check",at} · `phone` {text,pill,sub,bg}. Also `beforeafter`, `send` and all older overlays.
- Proof beats must be honest: show a before → after rewrite or an illustrative character moment ("my last reel got 6 views"), never fake view counts presented as real results.

## Carousel JSON (engine/carousel/build_carousel.py)
```json
{"id":"2026-10-31-c1","keyword":"IDEA",
 "cover":{"kicker":"SAVE THIS","title":"≤ 6 words","sub":"one line",
          "scene":{"set":"stage","cam":"wide","action":"celebrate","props":["confetti"],"sets":{}}},
 "slides":[{"type":"point","n":"01","title":"…","body":"≤ 30 words"},
           {"type":"list","title":"…","items":["…"]},
           {"type":"stat","value":"…","label":"…","body":"…"},
           {"type":"compare","title":"…","left":{"name":"…","items":["…"]},"right":{…},"winner":"right"},
           {"type":"quote","text":"…","by":"…"},
           {"type":"steps","title":"…","items":["…"]},
           {"type":"cta","title":"…","keyword":"IDEA"}]}
```
### Cover (slide 1): the most important slide
```json
"cover":{"style":"poster|frame","theme":"coral|teal|lilac|sun|ink","series":"PILLAR · SUBTOPIC",
         "kicker":"SAVE THIS","title":"Stop quoting one *flat fee*","sub":"one short line",
         "badge":{"big":"5","small":"LINE ITEMS"},          // optional round sticker (number/list hooks)
         "scene":{"set":"stage","cam":"close","action":"celebrate","props":["coins"],"sets":{}}}
```
- Text sits in the top half; the mascot scene is a framed window below (`poster`) or a full-bleed fade (`frame`).
- Title ≤ 7 words. Wrap the 1–2 punch words in `*…*` (highlighter pill). Works in every slide title too.
- Use a hook formula from LEARNINGS.md (bold number, contrarian, promise + timeframe, mistake, before/after). Don't reuse the previous day's formula.
- Rotate `theme` and `style` daily, and never repeat yesterday's combo (log it in LEARNINGS.md).
- Scenes that show Byte well: stage/close, desk/wide, studio/wide. Avoid machine/close and `pile` (they hide him).
- `badge` only when the title has a number or list.

Inner slides: one idea per slide, ≤ 30 words of body, *highlight* the key word in titles. A progress bar and the @claybyte.in avatar are added automatically. 6–9 slides total incl. cover and CTA.

## Daily research + improvement loop (do this BEFORE planning)
Goal: every day's posts should be better than yesterday's. Never skip this.
1. **Read** `LEARNINGS.md` (playbook, what was tried, what to try next) and yesterday's `research/<DATE-1>.md`.
2. **Review yesterday's output**: open 2–3 frames of each reel and the carousel cover from `build/` or the media URLs. Write 2–3 concrete things to improve.
3. **Research (at least 6 searches, 3 pages read)** with WebSearch / the web-fetch agent:
   - what's trending this week on Instagram (reel formats, hooks, audio-free styles) in AI tools, creator business and agency niches;
   - 2–3 top-performing posts or creators in the niche you can learn from (describe the format; never copy their content);
   - carousel/cover design inspiration (Pinterest, Dribbble and Behance boards if reachable; design blogs otherwise);
   - fresh, verifiable news in AI tools for creators (new features, launches) for timely topics.
   Instagram and Pinterest often block automated fetching; if so, say so in the notes and use search results, articles and newsletters instead.
4. **Write** `research/<DATE>.md`: findings with source URLs, 3 topic ideas per pillar, and the 2–3 specific upgrades you'll apply today.
5. **Apply at least one upgrade per item** (a new hook formula, a set/cam/prop combo not used recently, a new overlay type, a new cover theme/style, or a sharper caption structure). If an upgrade needs an engine change (new overlay, new slide type, better layout), make it, test it with stills, and commit it.
6. **Update** `LEARNINGS.md` at the end: append today's row to the log and edit the playbook if something was learned.

## Daily plan file (pipeline/run_daily.py input)
```json
{"date":"2026-10-31",
 "items":[
   {"slot":1,"kind":"carousel","publish_at":"2026-10-31T10:00:00+05:30","spec":{...carousel json...},"caption":"…","keyword":"IDEA","topic":"…","pillar":2,"sources":[]},
   {"slot":2,"kind":"reel","publish_at":"2026-10-31T13:30:00+05:30","script":{...reel json...},"caption":"…","keyword":null,"topic":"…","pillar":1,"sources":["https://…"]},
   {"slot":3,"kind":"reel","publish_at":"2026-10-31T19:30:00+05:30","script":{...},"caption":"…","keyword":"HOOK","topic":"…","pillar":3,"sources":[]}
 ]}
```
