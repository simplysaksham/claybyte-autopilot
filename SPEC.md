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
Cover scenes: show the mascot clearly (cam wide or close, avoid `pile` which hides him). 6–9 slides total incl. cover and CTA. One idea per slide.

## Daily plan file (pipeline/run_daily.py input)
```json
{"date":"2026-10-31",
 "items":[
   {"slot":1,"kind":"carousel","spec":{...carousel json...},"caption":"…","keyword":"IDEA","topic":"…","pillar":2,"sources":[]},
   {"slot":2,"kind":"reel","script":{...reel json...},"caption":"…","keyword":null,"topic":"…","pillar":1,"sources":["https://…"]},
   {"slot":3,"kind":"reel","script":{...},"caption":"…","keyword":"HOOK","topic":"…","pillar":3,"sources":[]}
 ]}
```
