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
- Conveyor set (side or wide) hides Byte behind the bin; avoid it unless the belt is the point. In duet reels, `grid`/`phone` overlays on face close-ups cover the face: use `wide` cam or a `pill`. `cta` overlay: set `follow:false` in duet reels (the follow line collides with bold captions). Card items appear when their first word is spoken, so start each item with a spoken word. (stills 2026-11-01)
- Stills gotcha: build_reel reuses existing stills files; delete `<out>/<id>_work/stills` before re-rendering stills.
- DUET FORMAT (from a reference reel the owner shared, 2026-10-31): two characters talking (creator + AI helper), dark navy set with bokeh, face close-ups with a punch-in on every line, 2–3-word bold captions, a chapter chip with step dashes, and live UI widgets (views pill counting up, big counters with bars, stamps, terminal typing). Structure: specific-time pain hook ("3:12 AM… 6 views") → proof → "show me how" → 3–5 steps → cost objection → payoff → CTA. Use it for at least one reel a day; see SPEC "Duet reels".
- 2026-10-31 owner feedback on the first duet: wants more realistic voices, more appealing visuals, and Byte in ORANGE (done: brand mascot is now orange, Pip wears teal). Visual upgrades that worked: bloom, a pink/cyan synthwave horizon glow, cyan back-rim light, eye catchlights, a nose on Pip so the mouth reads. Keep the floor matte; a glossy floor caused a white glare in the side cam.
- Voice: kokoro's male voices are weak (C+), af_heart is the best. Pip uses a blend "am_michael:0.6+am_fenrir:0.4" plus the room chain. Best fix is ElevenLabs via Higgsfield (≈0.15 credits/line), blocked until cdn.higgsfield.ai and d1xarpci4ikg0w.cloudfront.net are on the allowed-domains list.
- `caps:"bold"` works in classic (non-duet) reels too and reads far better than 1-word chips with sound off. Studio/close crops Byte at the frame edge and scatters chips; use a `card` on studio/wide. Machine/low reads well (Byte in front of the machine); machine/side hides Byte. In duet reels the `phone` overlay covers both characters on wide; use a `pill` instead. Any top overlay covers a head on `two`/`low`/`close`; only put overlays on beats where the covered character is the listener. (stills 2026-11-02)
- Bold captions default to y=780 (of 1280), right over Byte's face in classic sets. Set `caps_y: 985` in classic reels (below Byte) and per-beat `caps_y: 760` on machine/low beats (Byte stands low there). Duet reels keep the default. (stills 2026-11-03)
- Game format (this-or-that): question beat = `compare` with no winner; answer beat = same `compare` with `winner` + `reveal: 0.12` (loser dims). One item per side switches to big 31 px text. Put a twist in the last round. Overlays on Pip's opening face close-up hit his beanie; leave the first close-up clean. (2026-11-03)
- Duet `close` cam frames Pip, not Byte; use the `byte` cam for Byte's lines (pulled back on 2026-11-08 so the antenna and whole body fit). `safezone` overlay (mini phone) needs `x`/`scale` to sit beside Byte: desk/side → x 76%, studio/wide → x 77% (Byte stands left-centre in both). (stills 2026-11-08)
- Recurring formats build habit: consider a named series ("Byte fixes your…", "60-second Claude skill").

### Carousels
- Cover: ≤ 7 words, one highlighted punch word, strong contrast, text in the top half, a clear swipe cue. (carouselli; resont; pineable)
- Hook formulas for covers: bold number, contrarian, promise + timeframe, mistake ("You're pricing this wrong"), before/after, question.
- Inner slides: one idea each, consistent grid, progress indicator, 6–9 slides for tips, recap slide before the CTA for long ones. (pineable; brandghost; krumzi)
- Put a mid-carousel save prompt in long carousels. (pineable)
- Text-only "number + paragraph" inner slides leave half the slide empty. Prefer `flag` (bubble + fix card) or `list`/`compare` layouts; end long carousels with a `recap` cheat sheet. (review 2026-10-31; wavegen)
- `doc` slide (paper invoice/brief mock with numbered highlighted lines) works as the mid-carousel "sendable screenshot". CTA slides can take a `scene` (mascot window) so the last slide isn't empty; set the studio laptop text to match the topic. (2026-11-01)
- Cover title of 7 words wraps to 3 lines at 128px; keep the sub to ONE short line or it runs into the poster window. (2026-11-01)
- `chat` slide (DM thread: client bubble → your copy-paste reply + "why it works") is the reply-script layout; use it for "what to say" carousels. Cover highlight pill now sits lower (top .22em) with h1 line-height 1.0, so it no longer overlaps the line above. Avoid a closing quote mark right after a highlighted word (it dangles). Frame-style window is 660 px tall so the sub line stays clear. Desk/side cover scene shows Byte bigger than desk/wide. (2026-11-02)
- `bars` slide (stage → value meter rows) fills the slide for tiered numbers (pricing by stage, fees by tier). Teal/poster: a 6-word title wrapped to 4 lines and hit the window; keep teal/poster titles ≤ 5 short words. (2026-11-03)
- `check` slide (yes/no scorecard + verdict stamp) = the "worked example" slide for decision carousels (question → criteria → worked example → script → recap). Number every doc row or none; partial numbering looks broken. desk/side cover scenes let the phone fill the window and crop Byte (11-06); desk/wide with action shock shows Byte whole. (2026-11-08)
- Cover scenes: desk/wide with a custom phone message tied to the topic reads best; stage/close and stage/wide hide Byte's body behind the stage lip in the poster window. (tested 2026-10-31)

### Cover rotation (never repeat yesterday's combo)
| theme | style |
|---|---|
| coral, teal, lilac, sun, ink | poster, frame |

## Ideas to try next
- (started 11-01) Named series "Byte fixes · EP n" in duet reels; continue with EP 2 next time.
- Publishing is blocked (OAuth code 200 since 10-31; still failing on 11-06). Until fixed, nothing is getting real data.
- Runs for 11-04, 11-05 and 11-07 did not happen (11-06 built but never committed to main). Always commit + push at the end.
- (tried 10-31) Short ~16 s reel, recap slide, "send this to" CTA, before→after overlay. Judge once insights exist.
- Trend formats to adapt next: "Yes… but" split (needs a split overlay), a 0→100% "loading" build using the counter overlay, "the tool, the fuel, the work" 3-beat reel.
- Hook formulas tried: Specificity bait (11-01), Before State (11-01), Confession (11-02), Reframe + game (11-03). List tease + bait-and-switch two-beat (11-08). Not yet: "No, no, no… yes" (wrong way ×3 → right way), blind ranking.
- Timely AI-tool reel on the Oct 8 Claude Docs/Slides/Design GA, after reading Anthropic's own article.
- Cover combos not used yet: teal/frame, sun/frame (coral/frame 11-06, ink/frame 11-08).
- Next duet: Byte fixes · EP 6. Untried: "My reaction to ___" escalating numbers, blind-ranking game (rank 4 hooks), myth-vs-fact carousel.
- GitHub Pages (github.io) is blocked from the sandbox: review yesterday's media by cloning the `media` branch instead.
- Track performance: the publisher stores no likes/saves/reach yet. Pulling Instagram insights into Supabase would let this loop learn from real numbers.

## Daily log
| date | carousel cover (theme/style, hook formula) | reel 1 hook | reel 2 hook | upgrades applied | notes |
|---|---|---|---|---|---|
| 2026-10-29 | old cover design | callout/proof/versus | — | first live test | |
| 2026-10-30 | old cover design (text over dark shade) | pain: "stop re-explaining" | pain: "revision round 7?" | none (before loop) | cover judged too basic; redesigned 2026-10-30 (poster/frame styles, themes, highlight, badge, avatar, progress bar) |
| 2026-10-31 | ink/poster, bold number + timely pun ("5 client red flags to *ghost*"), badge 5, desk/wide scene | result first: "10 ideas from 1 paste" (before→after) | pain + rule: "Stop refreshing views" (16 s short lane) | flag + recap slides, beforeafter + send overlays, send-CTAs, no machine set | Halloween tie-in; IDEA only on r1 |
| 2026-11-01 | sun/poster, mistake ("Your invoice is why you're paid *late*"), no badge, desk/wide phone "Overdue 23 days" | specificity bait: vague→specific beforeafter (3 swaps: number, time, who) | duet EP 1, before-state: "11:48 PM… nothing to post tomorrow" (repurpose 1 post → 5 angles, IDEA) | doc slide + CTA mascot scene, first production duet reel, named series, cta follow:false, no conveyor | Oct 31 posts all failed (OAuth 200); owner notified |
| 2026-11-02 | lilac/frame, quote-question ("“One small *change?*” Reply like this"), no badge, desk/side phone "3rd small change" | confession: "I used to skip posting every time I felt tired" (bad-day post, tool/fuel/work trend, 30 s) | duet EP 2, before-state: "7:40 PM… great idea on my walk, gone" + objection beat (voice note → script, IDEA) | chat slide, cover pill/line-height + frame fixes, bold captions in classic reel, overlays kept off speaking faces | publishing still failing (OAuth 200); owner notified |
| 2026-11-03 | teal/poster, question + promise ("Cancelled? You still get *paid*"), no badge, desk/side phone "We're pausing the project" | game: "Pick the hook that stops the scroll. 3 rounds" (A or B, twist A wins in round 3) | duet EP 3, reframe: "You don't need a plan. You need a shot list." (brief → shot list, IDEA) | caps_y (captions below Byte), compare reveal/dim/big, bars slide, kill-fee doc clause | publishing still failing (OAuth 200); owner notified |
| 2026-11-06 | coral/frame, number + promise ("New client? Nail the first *5 days*"), badge 5, desk/side phone (Byte cropped) | "15-minute weekly reset" (3 moves, classic) | duet EP 4: first-line score + rewrite (IDEA) | (not logged that day; reconstructed from media) | run never committed to main; all posts failed (OAuth 200) |
| 2026-11-08 | ink/frame, decision question ("Tiny job: *take it* or pass?"), no badge, desk/wide phone "Just 1 quick reel?" | list tease: "Three rules for on-screen text. Rule three is the one nobody follows." (safezone overlay) | duet EP 5, bait-and-switch: "Forty people opened my profile!" → "How many followed?" → "Zero." (bio rewrite, IDEA) | check slide, safezone overlay, duet byte cam pulled back, all doc rows numbered, bars for example hours | publishing still failing (OAuth 200); owner notified |
