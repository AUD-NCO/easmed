# Airese brand brief

The source of truth for how Airese looks and talks. Read this before you design a screen or write any copy.

Sources:
- *Airese Voice and Tone* deck (for review, October 2026)
- *Airese Visual Language (Mood Board)* deck (October 2026)

Both are still awaiting sign-off. When this file and the code disagree, this file wins. Update the code, or update this file if the decks change.

---

## 1. What Airese is

> **Airese shows people what happened while they slept and helps them decide what to do next.**

- A **B2C phone app** from **Easmed**. It records the night through the phone microphone and detects snoring and paused breathing. No watch or mat is needed.
- **Why it exists:** up to 80% of sleep apnoea cases go undiagnosed (Peppard et al., *Am J Epidemiol*, 2013, cited by Apple Health). Users think "it's just snoring."
- **Business goal:** move people from "It's just snoring" to "I should get this checked." Users become **leads** when they share a report with a doctor or contact Easmed.
- **How we're different:** Apple, Samsung and Withings need a watch or a mat. SnoreLab and Sleep Cycle stop at the recording. Airese works on a phone and can point to a next step.

### The user journey

**Dismissal → Curiosity → Evidence → Understanding → Concern → Action**

Each step needs its own message. Jumping straight from dismissal to fear makes people delete the app.

What snorers say before they hear a recording: "I didn't know that I snored at all." After a recording: "…and actually heard myself." **Recordings are the main proof.**

### What makes Airese different

For Singapore and Malaysia, the first step has to feel private, simple, and worth trusting. These four promises shape what the app says about itself (onboarding, permissions, store listing). They don't change the four voice principles.

| Promise | Means |
| --- | --- |
| **Private by default** | Start at home, before a clinic, test, or insurance question. |
| **Nothing extra to buy** | Your phone does the work. No watch, ring, mat, or extra hardware. |
| **Evidence you can hear** | Airese turns the night into short moments, patterns, and proof. |
| **A clearer next step** | Know when to watch, when to share, and when to get checked. |

**Local insight:** people may want to understand what is happening before entering the healthcare system.

**Journey ownership:** Marketing earns the first night. Product earns belief. Care earns action.

---

## 2. Product principles

Taken from the competitor research.

| Learned from | Principle |
| --- | --- |
| SnoreLab | Recordings are the main proof. |
| Sleep Cycle | Assume two people in the room (tell the user apart from their partner). |
| Oura | One headline number first, detail on tap. |
| Apple Health | Privacy wording in one short line. |
| Samsung Health Monitor | Flag something only after several nights. |
| Withings | Claim only what we've validated. |
| Healthdirect (AU) | Recordings can go to the GP, in place of the partner describing the night. |

---

## 3. Voice and tone

### Four principles

| Principle | Means | ✗ Avoid | ✓ Use |
| --- | --- | --- | --- |
| **Plain** | Words a sleepy person understands at 6 am | 17 respiratory events detected. | Your breathing was interrupted 17 times last night. |
| **Factual** | Say what we heard, not what we infer | You may have sleep apnoea. | Your breathing paused often last night. |
| **Calm** | Not pushy, alarming or intimidating | Poor sleep detected. | Last night was more broken than usual. |
| **Useful** | Every message helps the user take a next step | Consult a doctor immediately. | Hear what happened at 2:14 am. |

### Where Airese sits on each scale

| Scale | Position | Example |
| --- | --- | --- |
| Clinical ↔ Conversational | Leans conversational | You snored for 48 minutes, mostly after 3 am. |
| Alarming ↔ Reassuring | Leans reassuring | One night is hard to read on its own. We'll see how the week looks. |
| Technical ↔ Plain | Plain | Your breathing paused 12 times. |
| Judging ↔ Observing | Strongly observing | You moved around more than usual. |
| Gentle ↔ Direct | Middle, slightly gentle | This is worth getting checked. |

### Two ways to get it wrong

- **Too scary:** "Warning: signs of sleep apnoea detected." People panic, or leave.
- **Too soft:** "Interesting night! Tap to take a look." People never act.

### The escalation ladder

Airese gets more serious over time. **Each step unlocks only when the data supports it. Engineering and Clinical set the thresholds.**

| # | Step | Example |
| --- | --- | --- |
| 1 | Notice | You snored for 42 minutes. |
| 2 | Compare | That's more than your usual. |
| 3 | Spot a pattern | 4 of the last 7 nights. |
| 4 | Explain | Loud, frequent snoring can come with paused breathing. |
| 5 | Suggest | Worth mentioning to a doctor. |
| 6 | Help them act | Share your report. |

### The pattern screen: where users become leads

The message names the pattern and offers **one** action. This screen gets tested the most.

```
This week
5 of 7 nights
Your breathing paused often on 5 of the last 7 nights.
This is worth getting checked by a doctor.

[ Share report with a doctor ]   ← primary
  Contact Airese Support         ← quiet
```

Wording and thresholds depend on what Engineering can detect with confidence.

### Same voice, different moments

| Moment | Feels | Airese says |
| --- | --- | --- |
| First open | Curious | Let's find out what happens while you sleep. |
| Mic permission | Upfront | Airese listens all night for snoring and breathing. Your recordings stay on your phone. Private and safe. |
| Good night | Quiet | A steadier night. |
| A recording | Matter of fact | 2:14 am. 40 seconds. Have a listen. |
| Sharing with a partner | Kind | Here's what last night sounded like. |
| No data | Helpful | Couldn't hear clearly. Put your phone closer to the bed. |
| A recording problem | Plain, no blame | Recording stopped at 2:14 am. Your phone interrupted it. Keep it charging, with Do Not Disturb on. |
| Getting better | Encouraging | Your breathing was steadier this week. |

### Wording swaps

| ✗ Avoid | ✓ Use |
| --- | --- |
| Snore score 82. Critical. | You snored for 1 hr 20 min, mostly after 3 am. |
| Severe snoring detected | You snored more than usual. |
| Upper airway obstruction | Your airway narrowed while you slept. |
| You crushed it! | A steadier night. |
| You failed to hit 7 hours | You slept 5 hr 40 min. |

### Off limits

- Diagnosing
- Blaming weight, age or drinking
- Inventing urgency
- Comparing the user to "normal people"
- Badges or streaks for sleep
- Claiming more than the tech can detect

### One finding across channels

The finding: *breathing paused often on 4 of 7 nights.*

| Channel | Says |
| --- | --- |
| App | Your breathing was interrupted more often this week. |
| Push | There's a pattern worth looking at this week. |
| Email | Your weekly sleep report is ready. |
| Doctor report | Breathing disturbances on 4 of 7 recorded nights, 26 Sep to 2 Oct. Audio attached. |
| Ad | Record your snoring tonight with just your phone. Privately. |

The doctor report gets exact dates and counts. The ad stays general.

### Success measures

- More users go from a flagged pattern to sharing a report or booking.
- People keep using the app for more than one night.
- Fewer people turn off notifications.
- First A/B test: two versions of the "worth getting checked" message.

---

## 4. Visual language

### Same data, different reader

Easmed's medical B2B tools and Airese show the same data, but they're built differently.

| Medical B2B | Airese B2C |
| --- | --- |
| Dense data | Important data first |
| Clinical language | Everyday language |
| White and blue | **Night-appropriate dark UI** |
| Designed for interpretation | Designed for understanding |
| Utility first | Utility + comfort |
| **Clinical accuracy** | **Clinical accuracy** |

**Interaction model:** Glance. Understand. **Act.**

**Feels like:** Calm · Clear · Private · Trustworthy · Modern · **Medical, not clinical**

**Big no:** hospital software, meditation app, fitness dashboard, AI sci-fi, scary warnings, novelty snore app.

### Take from the references

- **Plain words:** a score explained in a sentence ("Excellent").
- **Sentence first:** a sentence above every chart ("Here are the sleep stages from your recent night's sleep.").
- **Listen:** "Listen to your sleep" next to the headline number.
- **Hierarchy:** one big headline, then the key numbers.
- **Timeline:** the night on a time axis, with snore events marked.

### Leave out

- **Mascots**
- **Rings and awards**
- **Comparing with other people or countries**
- **Paywalls over the data**
- **Clutter**

### Colour: "Night, with one warm light"

| Name | Hex | Role (proposed) |
| --- | --- | --- |
| Night | `#05070F` | Deepest background |
| Midnight | `#0B1020` | App background |
| Deep | `#19294E` | Cards and sheets (deck had `#131B2E`; changed by design, Oct 2026) |
| Mist | `#B3BDD3` | Secondary and muted text (deck had `#93A0BB`; lightened to pass WCAG AAA) |
| Moon | `#EEF1F7` | Primary text |
| Breath | `#9DB4FF` | Cool accent: breathing data, links |
| Lamp | `#F4B65F` | **The one warm light.** Use sparingly for the key number or the action. |

**Data colours** (Oct 2026, for Recording Details): each kind of data has one colour, the same everywhere: charts, data icons, legends, score rings. Marks and icons only, never text, buttons or links.

| Data | Colour | Token |
| --- | --- | --- |
| Snoring | Ember `#FFAA5C` | `dataSnoring` |
| Breathing interruptions | Iris `#B9A3FF` | `dataBreathing` |
| Sleep and rest | Dew `#8EE3CF` | `dataSleep` |
| Snoring loudness (quiet → very loud) | `#2EC9EA` · `#FFD84A` · `#FF9A3C` · Flare `#FF5A4F` | `loudness` |

- Checked together on Deep and Midnight with the dataviz palette validator: colour-blind separation ΔE ≥ 12, normal vision ≥ 19, 3:1+ contrast.
- **Breath stays out of charts.** It's the UI colour (buttons, links), and it's too close to Iris for colour-blind readers.
- Loudness runs cyan → yellow → orange → red (Oct 2026). Each colour is pinned to a decibel level, so only truly loud snoring reaches red. **Charts and graphs only**: never text, buttons or UI chrome.
- **How much, how loud: the ramp (Oct 2026).** Every mark that shows an amount of snoring or breathing pauses (score rings, hourly bars, score parts, guide scales, the timeline, tonight's bar) runs through the loudness ramp and ends in the colour its value reaches on its own fixed scale (`loudnessRamp`, `RampFill`, `dataInk`). So the same night reads the same colour on every page, and a quiet night stays cyan. Ember, Iris and Dew stay for data icons, badges and event markers (a breathing pause pill, a clip); sleep keeps Dew.
- Comparison bars: tonight in the ramp, earlier nights in neutral grey (faded colour turns muddy on Deep).
- Charts always label or shape their marks too, so colour is never the only cue.
- **Graphs behind text** (the verdict card) keep a readability budget: everything behind the words together (card gradient, glow, fill, line, shine) must leave Moon body text at 7:1 or more. Strengthen the graph only where there's no text.
- **The verdict card** changes colour with the night (Oct 2026): blue when ordinary, a subtle warm dusk when unusual, wine into plum with a slowly breathing Flare glow for a repeated pattern. Behind the words, the week as a graph in Breath, Lamp or Flare, and one button: Breath, Lamp, or the coral `urgentAction`. No status icons or dial: the words and the graph carry it.

Lamp is the only warm UI colour. **One red, Flare `#FF5A4F`**, used for marks only: the loudest snoring in charts (`loudness.veryLoud`), the repeated-pattern graph line, and form-error marks (`errorMark`: the field ring and icon). Error text uses a light tint of it (`error` `#FFA49B`, 7.5:1 on Deep, 10:1 on Midnight) to keep AAA contrast. Never red for headlines, status marks or written results: the words stay calm.

**One exception for buttons (Oct 2026): `urgentAction` `#FF7F72`**, Flare lightened to a coral, for the single care action on a repeated pattern (**Book a call** on the verdict card). It is the top of the escalation ladder, so the button carries the urgency and the words stay calm. Midnight label at 7.7:1 (AAA), 5.3:1 against the wine card. Nowhere else.

### Type

| Use | Font |
| --- | --- |
| Headings | **Montserrat** (semibold) |
| Buttons | **Montserrat** (regular) |
| Body | **Inter** |
| Data (times, durations) | **Inter** with tabular figures. (A monospace data face is still an open question, §5.) |

**Screen edges:** one standard side inset of **20 pt** on every screen (`space.gutter`). Cards and controls sit inside it.

**Type scale** (`type` in `src/theme/tokens.ts`). The base is 16 and the steps are about 1.25×. Reading text has a line height of at least 1.5×. **No text smaller than 12.**

| Style | Font | Size / line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `title` | Montserrat | 32 / 40 | SemiBold | Page titles, big numbers |
| `headline` | Montserrat | 24 / 32 | SemiBold | Screen headline (onboarding) |
| `heading` | Montserrat | 20 / 28 | SemiBold | Section and sheet titles |
| `body` | Inter | **16 / 24** | Regular | Base: all reading text |
| `small` | Inter | 14 / 22 | Regular | Secondary detail |
| `caption` | Inter | 12 / 18 | Regular | The minimum: credits, fine print |
| `button` | Montserrat | 16 / 20 | Regular | Button labels (Midnight on Breath, 9.4:1) |
| `buttonSmall` | Montserrat | 14 / 18 | Regular | Mini buttons in banners and cards |

**Two weights only: regular and semibold** (Oct 2026). Section labels are one style everywhere (`FormTitle`). Recording Details uses four sizes: `title` 32 (page title, big numbers), `heading` 20 (card and sheet titles), `body` 16, `small` 14. Big numbers are one size and weight, with no small units; durations use the compact `7h 36m`.

### Accessibility: WCAG 2.2 AAA

The design system targets **WCAG 2.2 Level AAA**. Every new screen must keep to these rules.

- **Text contrast of at least 7:1**, and 4.5:1 for large text (24 regular or 19 bold and up). Use the colour roles; they're checked.
- **Icons, controls and state indicators: at least 3:1** against what's behind them.
- **Touch targets of at least 44 × 44 pt.** If the visible mark is smaller, pad the tap area, as the page dashes do.
- **No text smaller than 12.** Reading text has a line height of at least 1.5×.
- **Text scales with the system setting up to 200%** (`AppText` allows ×2). Layouts must grow, not clip.
- **Reduce Motion is respected** (`useReducedMotion`): no slides, drift, parallax or breathing. Fades stay.
- **Every gesture has a tap alternative.** The carousel can be swiped, or moved with the dashes.
- **Screen readers:** headlines are marked as headers, decorative art is hidden, and controls have labels and state (for example "Page 2 of 3, selected").
- **Plain language** at a lower-secondary reading level (see Voice and tone).

**Checked pairs**

| Pair | Contrast | Needed |
| --- | --- | --- |
| Moon text on Midnight | 16.7 : 1 | 7 |
| Moon text on Deep (sheet) | 12.6 : 1 | 7 |
| Mist text on Midnight | 10.0 : 1 | 7 |
| Mist text on Deep (sheet) | 7.6 : 1 | 7 |
| Midnight label on Breath button | 9.4 : 1 | 7 |
| Moon caption on splash gradient | 10.5 : 1 (5.1 at the brightest blue) | 7 |
| Inactive page dash (Moon at 45%) | 4.1 : 1 | 3 |
| Info icon, sheet handle | 7.6 : 1 or more | 3 |
| Error red on Midnight / on Deep | 11.2 : 1 / 8.4 : 1 | 7 |
| Midnight label on Book a call (`urgentAction`) | 7.7 : 1 | 7 |
| Book a call button against the wine card | 5.3 : 1 | 3 |

### Icons

**Google Material Symbols (Material 3)**: Outlined style, weight 400. Use the `Icon` component (`src/components/Icon.tsx`), which draws the official paths. To add an icon, copy its path from `@material-symbols/svg-400/outlined/<name>.svg`. Don't mix in other icon sets.

### Motion

**One calm, unhurried feel for the whole app**, like settling down for the night. Every curve starts softly and lands softly. Nothing snaps, bounces or overshoots.

There are two presets in `src/theme/motion.ts`. Every animation uses one of them; don't hand-tune timings per screen. Design decides which preset applies where.

| Preset | Duration | easeOut (arriving) | easeIn (leaving) | easeInOut (between states) |
| --- | --- | --- | --- | --- |
| **slow**: elegant, smooth | 1200 ms | cubic-bezier(0.3, 0, 0.2, 1) | cubic-bezier(0.47, 0, 0.745, 0.715) | cubic-bezier(0.37, 0, 0.63, 1) |
| **fast**: a little snappier | 500 ms | cubic-bezier(0.2, 0, 0, 1) | cubic-bezier(0.4, 0, 0.8, 0.4) | cubic-bezier(0.45, 0, 0.2, 1) |

Also: `ambient` (9 s sine loop, for background breathing), `attention` (1.8 s lap of light around the record dial, then a 3 s rest; the one call-to-action loop), `glint` (2.4 s: on load a tiny shine draws the verdict card's graph from left to right, then glides along the finished line again after each 7 s rest; with Reduce Motion the graph is simply there) and `stagger` (350 ms offset between overlapping elements).

**Where each is used so far**

| Animation | Preset |
| --- | --- |
| Splash: logo and subtext arriving, falling away | slow |
| Onboarding: illustration fading in | slow |
| Onboarding: Next / Continue buttons | none (part of the page; they swipe with the text) |
| Permission, update and recording problem screens: graphic | none (there on load) |
| Bottom sheet and top sheet: appearing and closing | fast |
| Bottom sheet and top sheet: settling back after a short drag | fast |
| Home banner: the next message fading in | fast |
| Recording: the screen surfacing out of the record button's blue | slow |
| Verdict card: the graph drawn by a shine, then the occasional shine | glint |
| Verdict card, repeated pattern: the glow breathing | attention |

Overlap steps instead of chaining them, so motion flows. Swipes and scrolls follow the finger, with no easing. Respect the system Reduce Motion setting.

### Imagery

**Black and white. Deep blue. Real.** Use real people asleep in a dim room, toned blue, with an occasional warm bedside lamp. Show couples (the partner who hears the snoring). Avoid stock-photo cheer and sci-fi glow.

**Prompt graphics** (permissions, app update, recording problems; Oct 2026): one consistent style of glowing line art on a deep blue sphere, with warm Lamp highlights. One idea per graphic, shown at 200 pt. All are in the design system (Brand assets → Illustrations).

### Reference screens (mood board)

**"Last night" on phone:**
- Date, then the "Last night" title, then "Here's what we detected while you slept."
- A big **42 min** snoring-time card, with "8% of your sleep" and "Your usual is 15–25 min."
- A snoring timeline (12 am to 6 am) with snore events marked.
- A "Snoring example" audio clip: "2:14 AM · 00:40 · Have a listen."
- A privacy row: "Your data stays on this iPhone."

**Watch:** "Recording tonight" with an elapsed-time ring, and a morning summary: "42m snoring · Mostly 2–4 AM."

---

## 5. Open questions

- **Light vs dark: settled, dark.** `src/theme/tokens.ts` now maps its roles to the night palette: background is Midnight, surface Deep, text Moon, muted text Mist.
- **Navy `#2E3A5A`.** It's the logo and deck colour. Is it still used in the app, or only for marketing? (The app icon now uses the splash gradient, not Navy.)
- **Monospace font** for data isn't named in the deck.
- **Mood-board mockups** use reddish snore bars and an "up-arrow, more than your usual" badge. Both conflict with "no red / no scary warnings". Use Lamp in their place.
- **Splash gradient blues.** The splash (Figma "iPhone 16 & 17 Pro - 1") fades from Midnight `#0B1020` (Figma had `#16131B`; changed so the splash hands over seamlessly to the Midnight app background) through `#1C3470` to `#225ED8`. These blues aren't in the deck palette; Breath `#9DB4FF` is the only blue there. They live in `gradients.splash` in `src/theme/tokens.ts`. Decide whether this blue joins the palette (for example as a brand blue) or stays splash-only.
- **Sign-off pending** on the four principles, the mood, and Engineering's confidence thresholds for the ladder.
