# ClayByte learnings and playbook

Read this before planning each day. Edit the playbook when something is learned; append to the log every day.
Research sources are in `research/<DATE>.md`. Stats below are second-hand from vendor blogs, so treat them as direction, not facts to quote in posts.

## Playbook (current best guesses)

### Reels
- Two lengths work: short single-claim proof reels (≈ 10–20 s) and fuller 30–60 s "teach me" reels. Avoid a flabby middle. (lightreel, Oct 2026)
- Hook must interrupt within 1–3 s: a specific pain moment, a contrarian claim, a result shown first, or a time objection ("this takes 2 minutes"). (lightreel; hootsuite)
- AI-tool content: show the finished result first, then the workflow on screen (terminal/laptop overlays). (lightreel)
- Sound-off viewers: banner + captions must carry the story alone; key text in the top half. (slidycreator; hootsuite)
- Shares/DM sends and saves are the strongest signals: end with "send this to a friend who…" or "save this" when there's no keyword CTA. (hootsuite; vaizle)
- Keep the product reveal or keyword CTA after the payoff, never before it. (lightreel)
- Overused, avoid: expectation-vs-reality splits, generic day-in-the-life, green-screen reactions. (slidycreator)
- Machine-set signs get clipped by the banner and clash with top overlays; avoid machine/wide when the beat has a bigstat/counter overlay. Desk/close hides Byte behind the phone; use desk/side or desk/wide. (stills 2026-10-31)
- Soft CTA: use the `send` overlay ("Send this to … the friend who …") instead of a sparse card. Result-first hooks: `beforeafter` overlay with `flip` ≈ 1.5 s.
- Stills gotcha: build_reel reuses existing stills files; delete `<out>/<id>_work/stills` before re-rendering stills.
- Recurring formats build habit: consider a named series ("Byte fixes your…", "60-second Claude skill").

### Carousels
- Cover: ≤ 7 words, one highlighted punch word, strong contrast, text in the top half, a clear swipe cue. (carouselli; resont; pineable)
- Hook formulas for covers: bold number, contrarian, promise + timeframe, mistake ("You're pricing this wrong"), before/after, question.
- Inner slides: one idea each, consistent grid, progress indicator, 6–9 slides for tips, recap slide before the CTA for long ones. (pineable; brandghost; krumzi)
- Put a mid-carousel save prompt in long carousels. (pineable)
- Text-only "number + paragraph" inner slides leave half the slide empty. Prefer `flag` (bubble + fix card) or `list`/`compare` layouts; end long carousels with a `recap` cheat sheet. (review 2026-10-31; wavegen)
- Cover scenes: desk/wide with a custom phone message tied to the topic reads best; stage/close and stage/wide hide Byte's body behind the stage lip in the poster window. (tested 2026-10-31)

### Cover rotation (never repeat yesterday's combo)
| theme | style |
|---|---|
| coral, teal, lilac, sun, ink | poster, frame |

## Ideas to try next
- A "named series" reel (episode 1) to build recurring viewers.
- (tried 10-31) Short ~16 s reel, recap slide, "send this to" CTA, before→after overlay. Judge once insights exist.
- Trend formats to adapt next: "Yes… but" split (needs a split overlay), a 0→100% "loading" build using the counter overlay, "the tool, the fuel, the work" 3-beat reel.
- Hook formulas not tried yet: Specificity bait, Confession, Reframe, Before State.
- Timely AI-tool reel on the Oct 8 Claude Docs/Slides/Design GA, after reading Anthropic's own article.
- Cover combos not used yet: coral/frame, teal/poster, lilac/frame, sun/poster.
- Track performance: the publisher stores no likes/saves/reach yet. Pulling Instagram insights into Supabase would let this loop learn from real numbers.

## Daily log
| date | carousel cover (theme/style, hook formula) | reel 1 hook | reel 2 hook | upgrades applied | notes |
|---|---|---|---|---|---|
| 2026-10-29 | old cover design | callout/proof/versus | — | first live test | |
| 2026-10-30 | old cover design (text over dark shade) | pain: "stop re-explaining" | pain: "revision round 7?" | none (before loop) | cover judged too basic; redesigned 2026-10-30 (poster/frame styles, themes, highlight, badge, avatar, progress bar) |
| 2026-10-31 | ink/poster, bold number + timely pun ("5 client red flags to *ghost*"), badge 5, desk/wide scene | result first: "10 ideas from 1 paste" (before→after) | pain + rule: "Stop refreshing views" (16 s short lane) | flag + recap slides, beforeafter + send overlays, send-CTAs, no machine set | Halloween tie-in; IDEA only on r1 |
