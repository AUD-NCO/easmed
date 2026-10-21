# Airese design system

Everything used to build the Airese app: tokens, type, motion, icons, brand assets and every React Native component, with where each one is used.

**Everything here is built in React Native** (Expo SDK 57, TypeScript). There is no separate Figma library or web component kit: the code is the source of truth. Voice, tone and visual rules are in [docs/BRAND.md](docs/BRAND.md).

| | |
| --- | --- |
| Tokens | [`theme/tokens.ts`](theme/tokens.ts) |
| Motion | [`theme/motion.ts`](theme/motion.ts) |
| Components | [`src/components/`](components/) (all exported from [`index.ts`](components/index.ts)) |
| Brand assets | [`assets/`](../v2/assets/) |
| **This page, visual version** | **https://aud-nco.github.io/easmed/the-air-station/airese/design-system/** (real swatches, type in Montserrat and Inter, icons, motion demos; generated from the code by `design-system/scripts/build-design-system.mjs`) |
| See it running | https://aud-nco.github.io/easmed/the-air-station/airese/v2/ |

**The rules in one line each:**
- Screens use tokens and components only: no hard-coded colours, sizes, timings or curves.
- See-through colours are a palette colour at an opacity: `alpha(colors.moon, 0.24)`, never a hand-typed `rgba()`.
- Text uses `AppText`; icons use `Icon`.
- Every animation uses a motion preset.
- Everything meets WCAG 2.2 AAA.
- Keep the system small: add a token or component only when a screen needs it.

The swatch images on this page are written from `tokens.ts` every time the design system builds (`npm run design-system`), so they always match the code.

---

## Contents

1. [Colour](#1-colour)
2. [Typography](#2-typography)
3. [Spacing, corners and layout](#3-spacing-corners-and-layout)
4. [Motion](#4-motion)
5. [Icons](#5-icons)
6. [Brand assets](#6-brand-assets)
7. [Components](#7-components)
8. [Hooks and helpers](#8-hooks-and-helpers)
9. [Patterns](#9-patterns)
10. [Accessibility](#10-accessibility)
11. [Dependencies](#11-dependencies)
12. [Housekeeping](#12-housekeeping)
13. [Adding to the system](#13-adding-to-the-system)

---

## 1. Colour

**"Night, with one warm light."** A dark UI for use in bed, with one warm accent used sparingly. One red, Flare, for the loudest snoring in charts and form-error marks; a coral tint of it for the single Book a call button on a repeated pattern.

### Palette

| | Name | Token | Hex | Used for |
| --- | --- | --- | --- | --- |
| ![](swatches/night.svg) | Night | `colors.night` | `#05070F` | Deepest background, shadows |
| ![](swatches/midnight.svg) | Midnight | `colors.midnight` | `#0B1020` | App background |
| ![](swatches/deep.svg) | Deep | `colors.deep` | `#19294E` | Cards, sheets, form groups |
| ![](swatches/mist.svg) | Mist | `colors.mist` | `#B3BDD3` | Muted text (7:1+ on Midnight and Deep) |
| ![](swatches/moon.svg) | Moon | `colors.moon` | `#EEF1F7` | Text, titles |
| ![](swatches/breath.svg) | Breath | `colors.breath` | `#9DB4FF` | Accent: primary buttons, links, focus |
| ![](swatches/lamp.svg) | Lamp | `colors.lamp` | `#F4B65F` | The one warm light: the remedy button on an unusual night, the "what it means" wash. Use sparingly. |
| ![](swatches/ember.svg) | Ember | `colors.ember` | `#FFAA5C` | Data: snoring |
| ![](swatches/iris.svg) | Iris | `colors.iris` | `#B9A3FF` | Data: breathing pauses |
| ![](swatches/dew.svg) | Dew | `colors.dew` | `#8EE3CF` | Data: sleep and rest |
| ![](swatches/flare.svg) | Flare | `colors.flare` | `#FF5A4F` | The one red: loudest snoring in charts, form-error marks, the pattern graph line |

### Roles and special colours (what screens use)

| | Role | Token | Value |
| --- | --- | --- | --- |
| | Background | `colors.background` | Midnight |
| | Surface | `colors.surface` | Deep |
| | Text | `colors.text` | Moon |
| | Muted text | `colors.textMuted` | Mist |
| | Accent | `colors.accent` | Breath |
| | Text on accent | `colors.onAccent` | Midnight (also the label on Lamp and `urgentAction` buttons) |
| ![](swatches/divider.svg) | Divider | `colors.divider` | Mist at 18% |
| ![](swatches/scrim.svg) | Scrim | `colors.scrim` | Night at 70%, behind sheets |
| ![](swatches/error.svg) | Error text | `colors.error` | `#FFA49B`, a light tint of Flare (7.5:1 on Deep, 10:1 on Midnight) |
| ![](swatches/error-mark.svg) | Error mark | `colors.errorMark` | Flare: the field ring and icon, never text |
| ![](swatches/urgent-action.svg) | Urgent action | `colors.urgentAction` | Coral `#FF7F72`, Flare lightened: **only** Book a call on a repeated pattern. Midnight label 7.7:1; 5.3:1 against the wine card |
| ![](swatches/tint-accent.svg) | Breath wash | `colors.tintAccent` | Breath at 16%: profile tile badges, the selected gender tile, the missed-nights note, the Last night tag |
| ![](swatches/brand.svg) | Airese navy | `colors.brand` | `#2E3A5A`: logo, decks |
| ![](swatches/white.svg) | White | `colors.white` | `#FFFFFF`: logo on the splash, switch thumbs |

### Data colours

One colour per kind of data, the same everywhere: charts, data icons, legends, score rings. **Marks and icons only, never text, buttons or links.** Every chart also labels or shapes its marks, so colour is never the only cue. Checked together on Deep and Midnight for colour-blind separation (ΔE 12+) and 3:1+ contrast.

| | Data | Token | Hex | Soft tint (icon badges, level chips) |
| --- | --- | --- | --- | --- |
| ![](swatches/ember.svg) | Snoring | `colors.dataSnoring` | `#FFAA5C` (Ember) | ![](swatches/tint-snoring.svg) `colors.tintSnoring` |
| ![](swatches/iris.svg) | Breathing pauses | `colors.dataBreathing` | `#B9A3FF` (Iris) | ![](swatches/tint-breathing.svg) `colors.tintBreathing` |
| ![](swatches/dew.svg) | Sleep and rest | `colors.dataSleep` | `#8EE3CF` (Dew) | ![](swatches/tint-sleep.svg) `colors.tintSleep` |

Breath stays out of charts: it's the UI colour, and too close to Iris for colour-blind readers. Earlier nights in charts use a neutral Moon tint (`alpha(colors.moon, 0.14–0.16)`).

### Loudness ramp

![](swatches/loudness-ramp.svg)

`loudness` in tokens: cyan, yellow, orange, Flare red. Each step is pinned to a decibel level, so only truly loud snoring reaches red. **Charts and graphs only**, never text, buttons or UI chrome. Also the Sound Score ring and the calendar rings.

| | Level | Token | Hex |
| --- | --- | --- | --- |
| ![](swatches/loud-light.svg) | Light | `loudness.light` | `#2EC9EA` |
| ![](swatches/loud-moderate.svg) | Moderate | `loudness.moderate` | `#FFD84A` |
| ![](swatches/loud-loud.svg) | Loud | `loudness.loud` | `#FF9A3C` |
| ![](swatches/loud-very-loud.svg) | Very loud | `loudness.veryLoud` | `#FF5A4F` (Flare) |

### Gradients

| | Name | Token | Stops (top to bottom) | Used for |
| --- | --- | --- | --- | --- |
| ![](swatches/gradient-splash.svg) | Splash | `gradients.splash` | `#0B1020` → `#1C3470` → `#225ED8` | Splash, Home and Recording backgrounds (`AmbientGradient`), the record button's fill |
| ![](swatches/gradient-hero.svg) | Hero | `gradients.hero` | `#1C3470` → `#19294E` | Verdict card, ordinary and first nights; the no-data card |
| ![](swatches/gradient-hero-watch.svg) | Hero, watch | `gradients.heroWatch` | `#3D2E3C` → `#19294E` | Verdict card, unusual night (a warm dusk) |
| ![](swatches/gradient-hero-urgent.svg) | Hero, urgent | `gradients.heroUrgent` | `#5A1C24` → `#2E1830` | Verdict card, repeated pattern (wine into plum) |

### Verdict moods

The verdict card at the top of a report ([`VerdictCard`](components/VerdictCard.tsx)): card colours, the graph behind the words, and the one button. No icons, no dial: the words and the graph carry it.

| Night | Card | Graph | Button |
| --- | --- | --- | --- |
| Ordinary, first night | `gradients.hero`, soft Breath glow | Breath line, low and nearly flat (real data) | **Keep tracking**, Breath |
| Unusual | `gradients.heroWatch`, soft Lamp glow | Lamp line climbing to tonight (real data) | **Try using a remedy**, Lamp |
| Repeated pattern | `gradients.heroUrgent`, soft Flare glow that breathes | Flare line, a drawn climb across the card (a picture, not data) | **Book a call** with a phone icon, `urgentAction` |

**Readability budget:** behind the words, the card gradient, glow, graph fill (4%), graph line (6 to 14%) and shine together keep Moon body text at 7:1 or more at the card's brightest point (measured 9:1 or better). Below the words the graph fades up to full strength. The glow strengths (10%, 10%, 16%) are capped for the same reason.

---

## 2. Typography

**Montserrat for titles and buttons; Inter for everything you read.** Both from Google Fonts (`@expo-google-fonts/montserrat`, `@expo-google-fonts/inter`). **Two weights only: regular (400) and semibold (600).**

| Variant | Font | Size / line height | Weight | Used for |
| --- | --- | --- | --- | --- |
| `title` | Montserrat | 32 / 40 | Semibold | Page titles, big numbers |
| `headline` | Montserrat | 24 / 32 | Semibold | Onboarding headlines; emoji flags take this size |
| `heading` | Montserrat | 20 / 28 | Semibold | Card and sheet titles, the calendar month |
| `body` | Inter | 16 / 24 | Regular | All reading text (the base), form inputs, Recording screen text |
| `small` | Inter | 14 / 22 | Regular | Secondary detail, labels, legends, section labels |
| `caption` | Inter | 12 / 18 | Regular | The minimum: credits, fine print, tab labels |
| `button` | Montserrat | 16 / 20 | Regular | Button labels |
| `buttonSmall` | Montserrat | 14 / 18 | Regular | Mini buttons in banners and cards |

- **Scale:** steps of about 1.25 (major third): 12 · 14 · 16 · 20 · 24 · 32. **Nothing smaller than 12.**
- **Line height:** at least 1.5× for reading text (WCAG 1.4.8).
- **Title colour:** Moon on every page, including Home over its gradient.
- **Section labels:** one style everywhere (`FormTitle`): small, uppercase, Mist, 1 pt tracking.
- **Action labels under the big buttons:** `body` in Moon ("Tap to start recording", "Tap to stop recording").
- **Big numbers:** one size and weight, with no small units. Compact durations ("7h 36m") only in big numbers; sentences say "1 hr 20 min".
- **Dynamic Type:** text scales with the system setting up to 200% (`maxFontSizeMultiplier={2}` in `AppText`).
- **Digits:** times use tabular figures, so they don't jump as they change.
- **Exception:** the browser-only system alert stand-in uses the system font on purpose (it imitates iOS).

---

## 3. Spacing, corners and layout

### Spacing (4-pt grid), `space`

| Token | Value | Typical use |
| --- | --- | --- |
| `xs` | 4 | Text to its subtitle |
| `sm` | 8 | Icon to label, small gaps |
| `md` | 12 | Between related items |
| `lg` | 16 | Inside rows, between cards in a pair; a tab title's distance below the status bar (`PAGE_TITLE_TOP`) |
| `xl` | 24 | Between sections, card padding |
| `xxl` | 32 | Big separations, footers |
| `gutter` | 20 | **The one screen edge** for every screen (iOS standard); also `PAGE_SIDE` |

### Corners, `radius`

| Token | Value | Used for |
| --- | --- | --- |
| `md` | 12 | Small surfaces, search fields, picker bands |
| `lg` | 16 | Cards, form groups, tiles |
| `xl` | 20 | Banners, the verdict card, the Recording tips box |
| `card` | 24 | Data cards (Recording Details) |
| `sheet` | 28 | Sheet corners (bottom and top sheets), Home banner |
| `pill` | 999 | Buttons, chips, tags, toasts |

Circles use half their own size; that's geometry, not a token.

### Layout constants

| Constant | Value | Where |
| --- | --- | --- |
| Touch target | 44 pt minimum | Every control (buttons 48, mini buttons 36 + 4 pt hit slop, icon buttons 56, setting rows 64, calendar days 48) |
| Tab title row | 16 pt below the status bar, 44 pt tall, control on the right | `PageTitle`, `PAGE_TITLE_TOP`; Home and Reports |
| Title-row control | 44 pt glassy circle (Moon 14%, Moon 24% edge) | `titleControl` in `Avatar.tsx`: the avatar and the calendar button |
| Sticky top bar | 44 pt below the status bar | `DetailPage`; controls in it are plain Breath glyphs |
| Tab bar clearance | 96 pt (`TAB_BAR_CLEARANCE`) | Bottom padding on tab screens; a sticky footer sits 24 pt above the tab bar |
| Form row | 52 pt minimum | `FormInput` |
| Safe areas | `useInsets()` | Every screen |

### Surfaces and depth

The UI is flat: depth comes from colour (Midnight → Deep), not shadows.

- **The exceptions:** a soft glow on the record button and inside the verdict card, a frosted Midnight bar (88%, blurred on web) behind sticky titles, and a soft Night shadow under the Recording tips box.

---

## 4. Motion

**Two presets, one feel: like settling down for the night.** Every animation uses one of these; nothing is hand-tuned per screen. Nothing snaps, bounces or overshoots. Swipes and scrolls follow the finger.

| Preset | Duration | easeOut (arriving) | easeIn (leaving) | easeInOut (between states) | Used for |
| --- | --- | --- | --- | --- | --- |
| `motion.slow` | 1200 ms | `bezier(0.3, 0, 0.2, 1)` | `bezier(0.47, 0, 0.745, 0.715)` | `bezier(0.37, 0, 0.63, 1)` | Arrivals: splash, the recording screen surfacing, charts growing in, score rings filling |
| `motion.fast` | 500 ms | `bezier(0.2, 0, 0, 1)` | `bezier(0.4, 0, 0.8, 0.4)` | `bezier(0.45, 0, 0.2, 1)` | Feedback: sheets (bottom and top), page slides, the record ring after a tap, toasts, the Home banner's next message |

| Helper | Value | Used for |
| --- | --- | --- |
| `motion.ambient` | 9000 ms, sine in-out | Looping background life: the gradient drift, the record button's breathing |
| `motion.attention` | 1800 ms, then 3000 ms rest | The light that runs once round the record ring to invite a tap; the urgent verdict card's breathing glow |
| `motion.glint` | 2400 ms, then 7000 ms rest | A tiny shine that draws the verdict card's graph on load, then glides along the finished line now and then |
| `motion.stagger` | 350 ms | Offset between steps, so things arrive in sequence, not all at once |
| `motion.hold` | 2500 ms | How long a passing message stays before it moves on ("Email verified", the lines while a night is looked through) |
| `motion.useNativeDriver` | `false` on web | The native driver isn't available in the browser |

**Reduce Motion** (`useReducedMotion()`) is always respected:
- slides become fades;
- loops hold still;
- charts and the verdict graph are drawn at once, with no shine.

---

## 5. Icons

**Material Symbols (Material 3), Outlined**, weight 400, grade 0, optical size 48, through the `Icon` component only. Paths are copied from the official set (`@material-symbols/svg-400`). `_fill` names are the filled variant, used for selected states.

| Group | Icons |
| --- | --- |
| Navigation | `chevron_left`, `chevron_right`, `keyboard_arrow_down`, `arrow_forward`, `keyboard_double_arrow_right`, `close`, `home`, `home_fill` |
| Actions | `add`, `remove`, `edit`, `edit_note`, `delete`, `call`, `location_on`, `search`, `play_fill`, `pause_fill`, `stop_fill`, `check` |
| Forms | `check_box`, `check_box_outline_blank` |
| Recording and sound | `mic`, `mic_fill`, `mic_off`, `graphic_eq`, `airwave`, `monitoring`, `history`, `hard_drive` |
| Sleep and time | `bedtime`, `bedtime_fill`, `schedule`, `schedule_fill`, `calendar_month`, `bed` |
| Status and trends | `check_circle`, `visibility`, `trending_up`, `trending_down`, `trending_flat`, `warning`, `error`, `info`, `lightbulb` |
| People and settings | `person`, `group`, `notifications`, `settings`, `lock`, `mail`, `description` |
| About you | `male`, `female`, `transgender`, `cake`, `height`, `monitor_weight`, `public` |
| Tips | `battery_charging_full`, `do_not_disturb_on` |

**Native tab bar** (`src/app/(tabs)/_layout.tsx`):
- **Home:** SF Symbols `house` / `house.fill` on iOS; Material `home` on Android.
- **Reports:** SF Symbols `doc.text` / `doc.text.fill` on iOS; Material `description` on Android.

**Flags** (phone country code, where you live) are emoji, sized from the type scale.

**To add an icon:** copy its path from `outlined/<name>.svg` in the official set into `PATHS` in [`Icon.tsx`](components/Icon.tsx), under the same name.

**Not in Material Symbols:** use [Health Icons](https://healthicons.org) (outline, MIT), copied into `HEALTH` in `Icon.tsx`. They're drawn on their own 48 × 48 grid. In use: `nose`, `face_sleepy`, `face_tongue`, `mouth`, `head`, `inhaler` (v1 Sleep Diary).

---

## 6. Brand assets

### Logo

| Stacked (mark above wordmark) | Horizontal |
| --- | --- |
| <img src="img/logo-stacked.svg" width="120" alt="Airese logo, stacked"> | <img src="img/logo-horizontal.svg" width="240" alt="Airese logo, horizontal"> |
| [`airese-logo.svg`](../v2/assets/brand/airese-logo.svg) · in code: `<Logo width color />` | [`airese-logo-hori.svg`](../v2/assets/brand/airese-logo-hori.svg) · not yet used in the app |

- **On the splash:** white on the gradient, with "Powered by The Air Station".
- **In footers (Profile, Our centres):** Mist, 44 to 52 pt wide, with "Powered by The Air Station".

### App icons and splash

| Asset | File | Notes |
| --- | --- | --- |
| iOS / App Store icon | [`assets/icon.png`](../v2/assets/icon.png) | 1024, square, no transparency (iOS rounds it). The white mark, 56% wide, on the splash gradient (Midnight → `#1C3470` → `#225ED8`) |
| Android adaptive icon | [`android-icon-foreground.png`](../v2/assets/android-icon-foreground.png), [`-background.png`](../v2/assets/android-icon-background.png), [`-monochrome.png`](../v2/assets/android-icon-monochrome.png) | All 1024. Foreground: the mark on transparent, sized to match iOS inside the visible 72/108 area. Background: the gradient (fallback colour Midnight in `app.json`). Monochrome: the mark, for Android 13 themed icons |
| Play Store listing | [`assets/store/play-store-512.png`](../v2/assets/store/play-store-512.png) | 512, the full icon. Uploaded in Play Console, not set in `app.json` |
| App Store screenshots | [`store/`](store/) | 1320 × 2868 PNG (6.9" iPhone), five: Recording, Home, a night's report, the calendar, brand. Headlines still placeholders. Downloadable from the design system page |
| Splash (native) | `app.json` → `expo-splash-screen` | Plain Midnight, no image, so it hands over to the animated splash screen (`SplashScreen.tsx`) without a flash |
| Favicon (web preview) | [`assets/favicon.png`](../v2/assets/favicon.png) | The app icon at 48 |

The icon's mark has slightly thicker bars than the logo (the second and third bars 1.3× and 1.7× wider), so all four stay visible at 29 pt. The logo files are unchanged.

### Illustrations

One style for every prompt: glowing line art on a deep blue sphere, with warm Lamp highlights. Shown at 200 pt (`PromptLayout`); files are 600 × 600, transparent.

| Onboarding 1: Record your sleep with just your phone | Onboarding 2: Private. Recordings stay on your phone | Onboarding 3: Know when it's worth getting checked |
| --- | --- | --- |
| <img src="../v2/assets/onboarding/1-hear.jpg" width="160" alt=""> | <img src="../v2/assets/onboarding/2-private.jpg" width="160" alt=""> | <img src="../v2/assets/onboarding/3-pattern.jpg" width="160" alt=""> |

| Microphone permission | Notifications permission | App update |
| --- | --- | --- |
| <img src="../v2/assets/permissions/microphone.png" width="140" alt=""> | <img src="../v2/assets/permissions/notifications.png" width="140" alt=""> | <img src="../v2/assets/prompts/update.png" width="140" alt=""> |

| Not enough space | Couldn't start recording | Couldn't hear clearly | Stopped in the night | Paused: app closed |
| --- | --- | --- | --- | --- |
| <img src="../v2/assets/problems/space.png" width="120" alt=""> | <img src="../v2/assets/problems/start.png" width="120" alt=""> | <img src="../v2/assets/problems/faint.png" width="120" alt=""> | <img src="../v2/assets/problems/stopped.png" width="120" alt=""> | <img src="../v2/assets/problems/app-closed.png" width="120" alt=""> |

**Imagery direction** (BRAND.md): black and white, deep blue, real. Real people asleep in a dim room, toned blue, with an occasional warm bedside lamp. No stock-photo cheer or sci-fi glow.

### Fonts

Montserrat and Inter, 400 and 600 of each, via `@expo-google-fonts/montserrat` and `@expo-google-fonts/inter`, loaded in [`src/app/_layout.tsx`](../v2/src/app/_layout.tsx). On web both come from Google Fonts ([`src/app/+html.tsx`](../v2/src/app/+html.tsx), [`public/iphone.html`](../public/iphone.html)), falling back to `system-ui, sans-serif`.

---

## 7. Components

All in [`src/components/`](components/), imported from `'../components'`. Grouped by job. "Used in" lists the screens.

### Foundations

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`AppText`](components/AppText.tsx) | The only text component. Applies a type variant and a colour token; scales to 200%. | `variant`, `color` | Everywhere |
| [`Icon`](components/Icon.tsx) | A Material Symbol as SVG (a Health Icon where Material has none). | `name`, `size`, `color` | Everywhere |
| [`Logo`](components/Logo.tsx) | The stacked Airese logo as SVG. | `width`, `color` | Splash, Profile, Our centres |

### Page structure and templates

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`PageTitle`](components/PageTitle.tsx) | A tab page's title row: the same size, colour (Moon), position and height on every tab, with a control on the right. Exports `PAGE_SIDE`, `PAGE_TITLE_TOP`. | `title`, `trailing` | Home, Reports (through `DetailPage`) |
| [`DetailPage`](components/DetailPage.tsx) | Page template: "‹ Back" (or no back on a tab's own page, which then uses `PageTitle`'s row), large title, subtitle (`\n` for a second line) with an optional tag pill, a top-right control (glassy in the title row, a plain glyph in the compact bar), sticky frosted compact title on scroll, optional sticky footer. Slides itself in on web. | `title`, `subtitle`, `subtitleTag`, `backLabel` + `onBack`, `trailing`, `footer(leave)`, `bottomInset` | Reports, Night Notes, Profile, Your details, Our centres, Terms and Privacy |
| [`PromptLayout`](components/PromptLayout.tsx) · `PromptBody` | Full-screen prompt: a 200 pt graphic centred above, then headline, reason, an optional how-to-fix line (Lamp lightbulb) and one button, anchored low. Skip or × top right. `PromptBody` is the same content inside a page with its own header (a problem night on Reports). | `art`, `title`, `body`, `fix`, `cta` + `onCta`, `onSkip`, `onClose` | Permission screens, app update, recording problems |
| [`AmbientGradient`](components/AmbientGradient.tsx) | The splash blues with two soft glows drifting slowly. Static with Reduce Motion. | `width`, `height` | Home, Recording |
| [`TabBar`](components/TabBar.tsx) | Floating two-tab bar (Home, Reports) for web and the preview (native uses the platform tab bar). Exports `HOME_TABS`, `TAB_BAR_CLEARANCE`. | `items`, `selected`, `onSelect` | Web tabs layout, preview |
| [`Screen`](components/Screen.tsx) | Background, safe areas, edges, status bar. | `children` | Not used (see Housekeeping) |

### Buttons and controls

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`Button`](components/Button.tsx) | Pill button. `primary` (48 pt): Breath fill, Midnight label. `quiet`: text only. `mini` (36 pt + hit slop): a small Midnight pill that hugs its label, for banners and cards. | `label`, `onPress`, `variant` | Onboarding, details, Home banner, sheets, Reports |
| [`IconButton`](components/IconButton.tsx) | Round 56 pt Breath button with a Midnight icon. Needs a label. | `icon`, `label`, `onPress` | Onboarding (Next) |
| [`InfoButton`](components/InfoButton.tsx) | The (i) that opens an explanation. | `onPress`, `label`, `size`, `color` | Onboarding, details, Recording, cards |
| [`Avatar`](components/Avatar.tsx) | 44 pt glassy circle with initials (or a person icon); opens Profile. Exports `titleControl`, the look it shares with the Reports calendar button. | `initials`, `onPress` | Home |
| [`ToggleChip`](components/ToggleChip.tsx) · `ChipGroup` | Multi-select pill (reads as a checkbox) and the wrapping row that holds them. | `label`, `selected`, `onToggle` | Night Notes |
| [`IconChoiceGrid`](components/IconChoiceGrid.tsx) | Multi-select as a grid of round icons with labels, four to a row; chosen gets a Breath ring and a check. Reads as checkboxes. | `options` (`id`, `label`, `icon`), `selected`, `onToggle` | Sleep Diary (v1) |
| [`IconStack`](components/IconStack.tsx) | A short row of overlapping round icons on Breath, fading out towards the end (five at most): what's chosen, without a list of words. Decorative. | `icons` | Sleep Diary banners (v1) |
| [`CheckInBanner`](components/CheckInBanner.tsx) | Small bright banner (Breath) that opens something: one line of text, what's chosen as an `IconStack`, a chevron. The whole row is the button. | `text`, `icons`, `label`, `onPress` | Sleep Diary: Bedtime check-in (Recording), Morning check-in (report) |
| [`SettingSwitch`](components/SettingRows.tsx) | A label (with an optional icon, to line up with `SettingRow`) and a native switch (Breath track, white thumb). Greyed out when disabled. | `icon`, `title`, `value`, `enabled`, `onChange` | Profile (Bedtime reminder) |
| [`SegmentedControl`](components/SegmentedControl.tsx) | iOS-style segmented control with a sliding Breath thumb. Radio group for screen readers. | `segments`, `selected`, `onSelect`, `label` | Height and weight sheets (units) |

### Forms and rows

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`FormGroup`](components/Form.tsx) | iOS Settings-style group: section label, Deep card, optional footer. Outlines in Breath while focused, in error red with an icon and message on error. `onSheet` gives the card the app background inside a sheet. | `title`, `titleAction`, `footer`, `error`, `row`, `onSheet` | Your details (onboarding and Profile), Profile, sheets |
| [`FormTitle`](components/Form.tsx) | **The one section label**: small, uppercase, Mist, 1 pt tracking. | `title`, `action` | Form groups, About you, Night Notes remedies |
| [`FormInput`](components/Form.tsx) | A plain native text input row (52 pt), with optional leading and trailing controls. | TextInput props, `leading`, `trailing` | Your details, sheets |
| [`FormDivider`](components/Form.tsx) | Hairline between rows (or between inputs in a row group). | `vertical` | Forms, Profile groups |
| [`PhoneField`](../v2/src/components/PhoneField.tsx) · `CountrySheet` | Phone number with a flag and country-code chip, formatted as you type (libphonenumber-js); pasting "+60…" picks the country. The searchable country sheet puts Singapore and Malaysia first. Exports `PHONE_WHY`. | `country`, `digits`, `onChange` | Your details |
| [`Checkbox`](components/Checkbox.tsx) · `InlineLink` | A 44 pt checkbox with a sentence that can hold inline links; a calm error line under it. | `checked`, `onToggle`, `label`, `error` | Your details (terms) |
| [`WheelPicker`](components/Pickers.tsx) | A scroll wheel for one number from a range. Scroll, tap a row, or swipe up and down with a screen reader. | `min`, `max`, `value`, `onChange`, `label`, `format` | Age sheet (year of birth) |
| [`RulerPicker`](components/Pickers.tsx) | A ruler you drag under a needle, with − / + and a number you can type. | `min`, `max`, `value`, `onChange`, `label`, `unit`, `display` | Height and weight sheets |
| [`AboutYou`](../v2/src/components/AboutYou.tsx) | Gender, age, height, weight and where you live as tiles; each opens a small sheet for that one question, then shows the answer. All optional, with (i). | `value`, `onChange` | Your details (onboarding and Profile) |
| [`SettingRow`](components/SettingRows.tsx) | Row inside a group: icon, title, optional detail; a chevron opens a page, an action pill does something here ("Turn on"). 64 pt. | `icon`, `title`, `detail`, `chevron`, `action`, `disabled`, `onPress` | Profile |

### Cards

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`Card`](components/Card.tsx) | Deep surface, 16 pt corners, 20 pt padding, optional title row with (i). | `title`, `onInfo` | Inside `InsightCard` |
| [`VerdictCard`](components/VerdictCard.tsx) | The night's verdict: headline, a sentence, one button by mood, and the week as a graph behind the words (see Verdict moods). Drawn on load by a shine. | `mood`, `title`, `body`, `values`, `action` | Reports |
| [`InsightCard`](components/InsightCard.tsx) · `HeroBackground` | A plain-language takeaway. Tones: `plain`, `hero`, `warm` (Lamp wash, "what it means"). `HeroBackground` is the mood gradient and glow, shared with `VerdictCard`. | `title`, `body`, `lead`, `icon`, `iconColor`, `tone`, `onInfo` | Reports |
| [`DataCard`](components/DataCard.tsx) · `BigNumber` | The Recording Details card: label with the data's icon, a visual or big number, one line of insight, "›" for more. Shapes: `wide`, `square`. | `shape`, `icon`, `tone`, `label`, `title`, `insight`, `onPress` | Reports |
| [`ScoreSummary`](../v1/src/components/ScoreSummary.tsx) | **v1.** One headline score as a full-width card: name, level as a big word, and the parts it's made of (or one line of facts) on the left, the ring on the right. | `tone`, `fraction`, `value` or `icon`, `name`, `level`, `parts`, `facts` | Reports, Option 2 |
| [`ScoreTile`](components/ScoreTile.tsx) | Headline score, half width: a big ring with the number (or icon) inside, the name, a level word on a tint, and a trend line when there's one (left out on part of a night). | `tone`, `fraction`, `value` or `icon`, `name`, `level`, `detail` | Reports (Sound Score, Breathing pauses) |

### Sheets and feedback

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`BottomSheet`](components/BottomSheet.tsx) | The base sheet: dimmed backdrop, glides up; tap outside or drag down to close. Rises above the keyboard. `fit` sizes to content; `dragFrom="top"` for scrolling content. | `visible`, `onClose`, `fit`, `dragFrom` | Confirmations, explanations, About you sheets, country picker |
| [`TopSheet`](components/TopSheet.tsx) | The bottom sheet's twin, dropping down from the top; drag up or tap outside to close. | `visible`, `onClose` | Reports (calendar) |
| [`ExplainSheet`](components/ExplainSheet.tsx) | Small explanation: title, a few sentences, optional action, "Got it". | `content`, `onClose`, `action` | Reports, Recording, details, Profile (About) |
| [`LargeSheet`](components/LargeSheet.tsx) | Near full-height sheet for "more" on a card, with a title, × and drag-down. | `visible`, `title`, `onClose` | Reports (score, snoring, breathing, sleep, clips, recent nights, night report) |
| [`PermissionSheet`](../v2/src/components/PermissionSheet.tsx) | A second chance at a permission; picks "why it matters" or "open Settings" from where the permission stands. | `kind`, `visible`, `onAllowed`, `onNotNow` | Home, Reports, Profile, permission screens |
| [`EmailCodeSheet`](../v1/src/components/EmailCodeSheet.tsx) | **v1.** Email check in two steps: a short "Check your email" sheet (where the code went), then a large sheet with six code boxes and Paste code; the right code shows "Email verified" and closes after `motion.hold`. | `email`, `visible`, `startInMail`, `onVerified`, `onClose` | Your details (onboarding and Profile) |
| [`MailDemo`](../v1/src/components/MailDemo.tsx) | **v1, browser preview only.** Stands in for the phone's mail app, open on the code email (`public/email-code.html`); Copy OTP copies the code and returns. Light, in a mail app's colours on purpose. | `onCopied`, `onBack` | `EmailCodeSheet` |
| [`Toast`](components/Toast.tsx) | A short confirmation pill with a check; fades in and out; announced once to screen readers. | `message`, `onDone` | Profile (after deleting recordings) |
| [`SystemAlertHost`](components/SystemAlertHost.tsx) | **Browser preview only.** Stand-in for the iOS permission alert (iOS styling on purpose). Renders nothing on device. | — | Root layout, preview |

### Recording

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`RecordDial`](components/RecordDial.tsx) | The record button: a round mic inside a ring of ticks. Tap lights the ring, then starts. At rest it breathes gently, and a light runs round the ring now and then. Under it, the action line and a privacy pill with a lock. | `size`, `note`, `ready`, `onStart(rect)` | Home |
| [`ListeningRing`](components/ListeningRing.tsx) | The stop button inside bars that rise and fall like a calm sound level. Blues only. | `size`, `onStop` | Recording |
| [`TipCarousel`](components/TipCarousel.tsx) | One-line tips in a very light frosted box with a soft shadow, one at a time; swipe or tap the dashes. Optional text action per tip. | `tips` | Recording |

### Reports

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`MonthCalendar`](../v2/src/components/MonthCalendar.tsx) | A month of nights, weeks from Sunday. Each recorded night has a Sound Score ring (dashed if Airese couldn't hear clearly; none if nothing was recorded). ‹ › for months; tap the title for a month-and-year grid. Only recorded nights can be picked. v1: a small Moon dot by the ring where the night's Sleep Diary was filled in. | `nights`, `selected`, `onPick`, `first`, `diary` | Reports (in a `TopSheet`) |

### Data visualisation

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`SnoringChart`](../v2/src/components/SnoringChart.tsx) | The night's sound level as one filled shape in the loudness ramp, against 40/60/80 dB; events above (pause pill, cough diamond, movement ring). `overview`: tap to pick a moment to hear. `explore`: playhead readout, pinch to zoom, − / + buttons. | `d`, `mode`, `height`, `moments`, `selected`, `onSelect` | Reports, its sheets, night report |
| [`NightTimeline`](../v2/src/components/NightTimeline.tsx) | Snoring bars every 3 minutes, breathing ticks, an asleep line with gaps; `full` adds tappable clip rings. Exports `asleepStretches`. | `details`, `full`, `clips`, `onClip` | All clips sheet |
| [`ScoreRing`](components/ScoreRing.tsx) | A ring filled to a fraction, optionally through a colour ramp; icon or number inside; fills in on arrival. Exports `scoreColor`, `rampColor`. | `fraction`, `color`, `ramp`, `icon`, `size`, `stroke`, `children` | `ScoreTile`, `MonthCalendar` |
| [`BenchmarkScale`](../v2/src/components/BenchmarkScale.tsx) | A bar split into named zones, tonight's zone filled, a marker for tonight and a tick for your usual. | `b`, `color` | Score sheets, night report |
| [`HourlyBars`](components/HourlyBars.tsx) | Minutes (or counts) per hour of the night, the busiest labelled; `compact` sparkline. | `hours`, `compact`, `color`, `what`, `unit` | Snoring tile, snoring and breathing sheets |
| [`LoudnessBars`](../v2/src/components/LoudnessBars.tsx) | How snoring split by loudness: dot, level, bar, share; `compact` stacked bar. | `share`, `compact` | Snoring sheet |
| [`RecentNightsChart`](components/RecentNightsChart.tsx) | Last 7 nights as bars, tonight in Ember with its value, a dashed line at your usual. | `nights`, `usual`, `format` | Recent nights card and sheet |
| [`ComparisonIndicator`](../v2/src/components/ComparisonIndicator.tsx) | Trend arrow and plain words ("Less than usual"), in neutral Mist: no green for good, no red for bad. | `trend`, `words` | Tiles, recent nights sheet |

### Audio

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`ClipPlayer`](../v2/src/components/ClipPlayer.tsx) | The large player: time, detail line, waveform that fills as it plays, framed **Pause** (dashed Iris) and **Loud breath** (solid Ember) marks, scrubber, round play/pause. | `clip`, `time`, `player`, `detail` | Your night in sound |
| [`AudioSnippet`](../v2/src/components/AudioSnippet.tsx) · `useClipPlayer` | A compact clip row (play, time, length, plain label, small waveform), and the shared player state for all clips on a page. Exports `clipColor`. | `clip`, `time`, `player` | All clips sheet |

### Recording Details parts

| Component | What it is | Key props | Used in |
| --- | --- | --- | --- |
| [`PrivacyFooter`](components/PrivacyFooter.tsx) | "Private by default" page footer: a large lock, one line, a link to more. Not a card. | `onMore` | Reports |

---

## 8. Hooks and helpers

| Name | File | What it does |
| --- | --- | --- |
| `useInsets()` | [`theme/useInsets.ts`](theme/useInsets.ts) | Safe-area insets (status bar, home indicator), including inside the preview's phone frame. |
| `useReducedMotion()` | [`theme/useReducedMotion.ts`](theme/useReducedMotion.ts) | The system Reduce Motion setting. |
| `motion` | [`theme/motion.ts`](theme/motion.ts) | The presets in section 4. |
| `colors`, `alpha()`, `loudness`, `gradients`, `space`, `radius`, `type` | [`theme/tokens.ts`](theme/tokens.ts) | The tokens in sections 1 to 3. `alpha(hex, opacity)` makes any see-through tint from a palette colour. |
| `formatDuration`, `formatClock`, `shortDuration`, `clockAt` | `src/lib/time.ts`, `src/lib/nightDetails.ts` | Plain time formats: "6 hr 30 min", "6:20 am", "7h 36m". Never `toLocaleString` (it differs by device). |
| `formatPhone`, `phoneE164`, `phoneDisplay`, `heightLabel`, `weightLabel`, `placeLabel`, `ageFrom` | [`src/lib/profile.ts`](../v2/src/lib/profile.ts) | Profile values for display ("+65 9123 4567", "172 cm" / "5′ 8″", "Petaling Jaya, Selangor"). Height and weight are always stored metric. |
| `homeMessage()` | [`src/lib/tips.ts`](../v2/src/lib/tips.ts) | The one Home banner message, by priority (microphone → notifications → charging → Night Notes). |
| `calendarNights()`, `recordedOfRecent()`, `dayKey()` | [`src/lib/reports.ts`](../v2/src/lib/reports.ts) | Each night's Sound Score for the calendar, and missed nights for the bedtime-reminder note. |

---

## 9. Patterns

| Pattern | How it's built |
| --- | --- |
| **Levels of detail** | L1 the page → L2 a small `ExplainSheet` for "why?" → a `LargeSheet` for "more" on a card. Dismissing returns to exactly where the user was. |
| **Tabs** | Home and Reports. Every tab's page uses `PageTitle`'s row: the same title, position and glassy control on the right. |
| **Pages from a row** | `DetailPage`: system push on device (slide in, swipe back); slides itself in on web. Back names where it goes. |
| **One message at a time** | Home's banner shows the single most useful message, by priority, with a mini button under the text. |
| **Short forms** | Type only what has to be typed (name, phone, email); everything else is a tile that opens a sheet for one question. Explanations live behind (i), not in footers. |
| **Grouped settings** | `FormGroup` cards holding `FormInput`, `SettingRow` or `SettingSwitch`, separated by `FormDivider`. |
| **Edit with a draft** | Edits are local until **Save** (sticky footer); Back discards them. Each field is checked on leaving it and again on Save. |
| **Confirm, then confirm it happened** | A `BottomSheet` with a plain title, what will happen, the action (named), and Cancel. Then a `Toast`. |
| **Permissions** | Ask in onboarding; never a wall; ask again in context with `PermissionSheet`, which switches to "Open Settings" once the system won't ask again. |
| **Empty states** | One heading, one helpful sentence that says what to do, one action. |
| **Charts** | A sentence above every chart. Single series has no legend; two or more get a legend with shapes. Each has a text alternative. Grows in once with the slow preset. |
| **Graphs behind text** | Everything behind the words (gradient, glow, fill, line, shine) must leave body text at 7:1 or more; strengthen a graph only where there's no text. |
| **Numbers** | One big number, no small units. Levels are words (Low, Moderate, High; Rarely, Sometimes, Often), never colour alone. |
| **Check-ins (v1 Sleep Diary)** | A `CheckInBanner` opens a page of icons to tap (`IconChoiceGrid`); once filled in, the banner shows them as an `IconStack`, never a list of words. "Same as last night" fills in the previous night's choices in one tap. Bedtime check-in on Recording; Morning check-in on every night's report. |
| **Brand presence** | Quiet: the logo with "Powered by The Air Station" on the splash and at the end of Profile and Our centres. |

---

## 10. Accessibility

Target: **WCAG 2.2 AAA.**

- **Contrast:** 7:1 for text. Moon and Mist pass on Midnight and Deep; Midnight on Breath is 9.4:1, on Lamp 10:1, on `urgentAction` 7.7:1. Data colours and controls need 3:1. Text over a graph keeps 7:1 at its brightest point.
- **Targets:** 44 pt minimum for every control.
- **Text size:** nothing below 12 pt; scales to 200%.
- **Colour is never the only cue:** words for levels, shapes for chart events, legends.
- **Motion:** Reduce Motion is respected everywhere.
- **Gestures:**
  - every gesture has a one-finger alternative (zoom buttons for pinch, dashes for the carousel, − / + and typing for the ruler, a row tap for the wheel);
  - charts and the year wheel are adjustable for screen readers (swipe up or down to step);
  - a tap never ends the night (stopping confirms).
- **Screen readers:**
  - every control has a label and state;
  - charts, score tiles and calendar days have spoken summaries ("Wednesday 7 October, Sound Score 62");
  - toasts and live values use polite live regions;
  - decorative images and graphs are hidden.

---

## 11. Dependencies

Design-relevant packages (all Expo SDK 57 compatible):

| Package | For |
| --- | --- |
| `react-native` 0.86, `react-native-web` | UI, browser preview |
| `react-native-svg` | Icons, logo, charts, rings, gradients, the verdict graph |
| `@expo-google-fonts/montserrat`, `@expo-google-fonts/inter`, `expo-font` | Type |
| `expo-router` (native tabs) | Navigation, tab bar |
| `react-native-safe-area-context` | Safe areas |
| `expo-splash-screen`, `expo-status-bar` | Launch, status bar style |
| `expo-audio`, `expo-notifications` | Microphone and notification permissions |
| `expo-haptics` | A soft tick as the wheel and ruler pickers change |
| `libphonenumber-js` | Phone number formatting and validation |
| `expo-constants` | App version in Profile |
| `expo-linking` | Call and directions links |

---

## 12. Housekeeping

Things to tidy or decide before handover:

- **App icon:** the Airese mark is in place (section 6). Check it on a release build; iOS dark and tinted variants aren't made yet.
- **Unused:** `Screen` and the horizontal logo (`airese-logo-hori.svg`). Keep them or remove them.
- **Overlaps:** `NightTimeline` and `SnoringChart` both draw the night. The timeline now only appears in the All clips sheet.
- **Lint:** the React Compiler rules (`react-hooks/refs`, `set-state-in-effect`) flag the `Animated.Value` refs used across the animation code. It's a known pattern, not a bug; moving animations to Reanimated would clear it.
- **Brand navy:** its role in the dark UI is still open (BRAND.md).

---

## 13. Adding to the system

1. **Check first:** can an existing token or component do it? Keep the system small.
2. **Tokens:** add to `tokens.ts` with a comment saying what it's for. Colours need a contrast check (7:1 for text, 3:1 for marks and controls); data colours also need a colour-blind check. Tints use `alpha()`.
3. **Components:** one file in `src/components/`, exported from `index.ts`. Start with a short doc comment: what it is, how it behaves, its Reduce Motion behaviour, how it reads to screen readers. Add it to `GROUPS` (and a one-line `BLURB`) in `design-system/scripts/build-design-system.mjs`.
4. **Motion:** use a preset in `motion.ts`. A new one goes into `motion.ts`, BRAND.md and this page together.
5. **Icons:** copy the official Material Symbols path into `Icon.tsx`.
6. **This page:** update it in the same change. The visual page and the swatches regenerate from the code on every push; check them with `npm run design-system` (writes `preview-dist/design-system/index.html` and `design-system/swatches/`).
