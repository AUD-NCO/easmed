# Airese: product requirements

What Airese does, screen by screen and module by module, as built in the prototype. Written for Easmed's product, engineering and clinical teams, and anyone joining the project.

| | |
| --- | --- |
| Product | Airese, by Easmed. Powered by The Air Station. |
| Platforms | iOS and Android phones (Expo / React Native). A browser preview exists for review only. |
| Status | Prototype for engineering handover, October 2026. Version 0.1.0. |
| Live prototype | https://aud-nco.github.io/easmed/the-air-station/airese/v2/ |
| Related docs | [BRAND.md](BRAND.md): voice, tone, colour, type, accessibility. [RECORDING.md](RECORDING.md): how long a recording runs, and why. |

**How to read this document.** Each module lists what it does, what the user sees, and its rules. Items marked **To confirm** need a decision from Product, Clinical, Legal or Engineering before release. Items marked **Prototype** behave differently in the prototype (usually sample data) and say what the real app must do.

When this document and the code disagree, raise it: either the code has a bug or this document is out of date.

---

## Contents

1. [Product summary](#1-product-summary)
2. [Principles](#2-principles)
3. [Scope](#3-scope)
4. [App map and navigation](#4-app-map-and-navigation)
5. [Modules](#5-modules)
   - 5.1 [Splash](#51-splash)
   - 5.2 [Onboarding walkthrough](#52-onboarding-walkthrough)
   - 5.3 [Permissions](#53-permissions)
   - 5.4 [Your details (onboarding)](#54-your-details-onboarding)
   - 5.5 [Home](#55-home)
   - 5.6 [Night Notes](#56-night-notes)
   - 5.7 [Recording](#57-recording)
   - 5.8 [Recording Details](#58-recording-details)
   - 5.9 [Reports](#59-reports)
   - 5.10 [Profile](#510-profile)
   - 5.11 [Notifications](#511-notifications)
   - 5.12 [Recording problems](#512-recording-problems)
   - 5.13 [App update](#513-app-update)
6. [Measures and how they're calculated](#6-measures-and-how-theyre-calculated)
7. [The escalation ladder](#7-the-escalation-ladder)
8. [Privacy and data](#8-privacy-and-data)
9. [Design system and accessibility](#9-design-system-and-accessibility)
10. [Technical notes for engineering](#10-technical-notes-for-engineering)
11. [Success measures](#11-success-measures)
12. [Decisions and open questions](#12-decisions-and-open-questions)
13. [Glossary](#13-glossary)

---

## 1. Product summary

**Airese shows people what happened while they slept and helps them decide what to do next.**

- **What it does:** records the night through the phone's microphone, detects snoring and paused breathing, plays back the moments that matter, and shows how each night compares with the user's own usual. No watch or mat is needed.
- **The problem:** up to 80% of sleep apnoea cases go undiagnosed. People think "it's just snoring."
- **The business goal:** move people from "it's just snoring" to "I should get this checked." A user becomes a lead when they talk to The Air Station's sleep care team or share a report with a doctor.
- **How it's different:** Apple, Samsung and Withings need a watch or a mat. SnoreLab and Sleep Cycle stop at the recording. Airese works on a phone and points to a next step.

### Who it's for

- **The snorer**, often prompted by a partner. Usually not technical. Reads the results groggy, at about 6:30 am.
- **The partner**, who hears the snoring and often pushes for action.
- **The curious and the doctor**, who want the detail behind the headline. They get it one level down (the night report), never on the main page.

### The user journey

**Dismissal → Curiosity → Evidence → Understanding → Concern → Action.** Each step needs its own message. Jumping from dismissal straight to fear makes people delete the app. Hearing yourself snore is the moment that creates belief; repeated evidence over several nights is what leads to action.

---

## 2. Principles

Full detail in [BRAND.md](BRAND.md). The ones that shape requirements:

- **Recordings are the proof.** Every results screen leads to something the user can hear.
- **Evidence, not alarm.** Real data can look striking; words stay calm. Airese escalates only when a pattern repeats (section 7).
- **One headline first, detail on tap.** Three levels: glance (everyone), explore (engaged users), report (the curious and doctors).
- **Plain, factual, calm, useful.** Say what was heard, never diagnose, never compare with other people.
- **Compare with yourself.** "Usual" means the user's own recent nights.
- **Private by default.** Sound is analysed on the phone; recordings stay on it.
- **Claim only what's validated.** No number appears unless Engineering and Clinical stand behind it.

---

## 3. Scope

### In the prototype

Splash, onboarding walkthrough, microphone and notification permissions, your details, Home (banner, record button), Night Notes, the Recording screen, Reports (Recording Details in six states, and the calendar), Profile (details, bedtime reminder, sleep care, centres, about, your data), recording problems (section 5.12), the forced app update (section 5.13), and the app icon.

### Not yet built

| Item | Notes |
| --- | --- |
| Sign-in, sign-out, accounts | Everything is on the phone. "Erase everything" replaces "delete account". |
| Real audio capture and analysis | All results use sample data generated per night (section 10). |
| Sharing a report with a doctor | The night report exists; sharing or exporting it doesn't. |
| Callback request flow | "Request a callback" closes the sheet; contact details and consent still to design. |
| Notification delivery | The bedtime reminder preference is stored; nothing is scheduled. |
| Detecting recording problems | Free space, start failures and interruptions are simulated by the demo nav (section 5.12). |
| Version check for updates | The update screen exists; nothing decides when to show it yet (section 5.13). |
| Partner sharing ("send this clip") | Proposed, needs a privacy design. |
| Remedy experiments ("did mouth tape help?") | Night Notes are captured but not yet compared across nights. |
| Photo upload | Out of scope by decision. |

---

## 4. App map and navigation

```
Splash ─► Onboarding walkthrough ─► Microphone ─► Notifications ─► Your details ─► Home
                                                                                   │
  Tabs: Home ◄──────────────────────────────────────────────────────────────► Reports
   │                                                                          │
   ├─ Night Notes (push)                                                      ├─ Last night's report (Recording Details)
   ├─ Record button ─► Recording (full screen) ─► stop ─► Reports              │    └─ sheets: scores, snoring, breathing,
   │    └─ can't start ─► Recording problem (full screen)                     │       sleep, clips, recent nights, night report
   └─ Avatar ─► Profile (push)                                                └─ Calendar (top sheet) ─► another night's report
                 ├─ Your details (push)
                 └─ Our centres (push)

Outside the flow: App update (full screen, forced) · Recording paused (over Recording)
```

- **Tabs:** Home and Reports, in a floating tab bar.
- **Pages opened from a row** (Night Notes, Profile and its pages) use the system push on device (slide in, swipe back). The browser preview slides them in itself.
- **Back** names where it goes ("‹ Home", "‹ Recording", "‹ Profile"). Reports has no back: it is a tab.
- **Sheets** (bottom sheets, large sheets, and the Reports calendar's top sheet) hold explanations, confirmations and "more" for a card. They close with a tap outside, a drag down, the × button, or Android back.
- **Recording** is a full-screen takeover with no swipe-back, so a half-asleep gesture can't end the night.

---

## 5. Modules

### 5.1 Splash

- **Shows:** the Airese logo on the night gradient, settling in with the slow motion preset.
- **Then:** falls away into the onboarding walkthrough.
- **Rules:** no loading text, no tagline.

### 5.2 Onboarding walkthrough

Three slides, each with an illustration, a headline (no subtext) and an (i) for more in a sheet.

| # | Headline |
| --- | --- |
| 1 | Record your sleep with just your phone. |
| 2 | Private. Recordings stay on your phone. |
| 3 | Know when it's worth getting checked. |

Each (i) adds one or two plain sentences (how a night is recorded; nothing leaves the phone unless shared; Airese only suggests a doctor when the same thing shows up night after night). The slides follow BRAND.md's four promises.

- **Next** moves through the slides; **Continue** fades in on the last.
- **Skip** sits below the status bar, top right.

### 5.3 Permissions

Two screens in onboarding, then a second chance in context whenever a permission is off. Never a wall: "Skip" and "Not now" always move on.

#### Microphone

- **Onboarding screen:** "Let Airese listen while you sleep." / "Airese listens all night for snoring and breathing. Your recordings stay on your phone. Private and safe." Button: **Allow microphone**.
- **System prompt text (iOS):** "Airese listens all night for snoring and breathing. Your recordings stay on your phone unless you choose to share them."
- **If off:** the Home banner shows "Airese needs your microphone to record your night." with **Turn on microphone** (section 5.5). Tapping the record button also asks, then starts recording once allowed. Profile → Settings shows the status with **Turn on**.

#### Notifications

- **Onboarding screen:** "Turn on notifications." / "A reminder at bedtime, so you don't miss a night."
- **If off:** the Home banner ("Turn on notifications for a bedtime reminder.") and the Bedtime reminder row in Profile → Settings show **Turn on**.

#### The second-chance sheet

Its message depends on where the permission stands:

| State | Message | Button |
| --- | --- | --- |
| Not asked yet, or skipped | Why it matters | Allow (shows the system prompt) |
| Said no | What's missing and how to turn it on | Open Settings (iOS asks only once) |

Coming back from Settings with the permission on continues automatically.


### 5.4 Your details (onboarding)

The last onboarding step: "Great! One last thing…" It's one short screen, not a multi-step form. Only name, phone and email are typed. Everything else is a tile that opens a small sheet built for that one question, and the tile then shows the answer.

| Field | Rules |
| --- | --- |
| First name, last name | **First name required** ("Add your first name."). Words capitalised. |
| Phone | **Required.** A flag and country-code chip (Singapore and Malaysia pinned first, then a searchable list), then the number, formatted as you type (SG "9123 4567", MY "12-345 6789"). Pasting a full "+60…" number picks the country. Errors: "Add your phone number." / "Check your phone number." (i) explains: "So the sleep care team can call you, when you ask them to. It stays on this phone until then." |
| Email | Optional, no verification. Checked on leaving the field: "Check your email address." |
| About you (optional) | Tiles. (i) explains: "It helps a doctor read your report better, if you choose to consult one. All of it is optional." |
| · Gender | Three icon tiles (Male, Female, Transgender), plus a quieter "Prefer not to say". Tapping one saves it and closes the sheet. |
| · Age | A year-of-birth wheel that shows "40 years old" as it turns. Line under the title: "Sleep and breathing change with age." The year is stored, because an age goes out of date. The tile shows the age. |
| · Height, weight | A ruler you drag, with − / + buttons and a number you can type. cm / ft·in and kg / lb switch; centimetres and kilograms by default. Line under the title: "With your weight (height), this gives your BMI. It helps us find insights relevant to you." Always stored in metric. |
| · Where you live | Singapore: one tap. Malaysia: pick one of the 16 states and federal territories, then type your town or city. Elsewhere: free text. The phone's country is suggested first. |
| Terms | **Required.** A checkbox above the button: "I agree to the Terms and Conditions and Privacy Policy." Both are links that open an in-app page (a placeholder for now). If it isn't ticked: "Tick the box to agree before you begin." The button stays enabled. |

- Native grouped form (iOS Settings style).
- Errors outline the group in the error colour and show an icon with the message.
- Anything skipped can be added later in Profile → Your details, which uses the same fields and sheets.

### 5.5 Home

The bedtime screen. One job: start a night's recording.

**Layout, back to front:**

1. A night-to-blue gradient with a slow, faint drift of light.
2. **The banner** (Breath): one message at a time, with its action as a mini button under the text.
3. **The panel**, which holds the record button.

**Header:** "Home" and the avatar (initials, or a person icon). The avatar opens Profile.

**Banner messages** (five for launch; the first that applies shows, and a new one fades in):

| Priority | When | Message | Action |
| --- | --- | --- | --- |
| P0 | Microphone off | "Airese needs your microphone to record your night." | **Turn on microphone** (permission sheet) |
| P0 | Last night stopped early (the morning after) | "Last night's recording stopped at 2:14 am. Everything up to then is saved." | **See what was saved** (that night's report) |
| P1 | Notifications off | "Turn on notifications for a bedtime reminder." | **Turn on notifications** |
| P2 | Not dismissed yet | "Keep your phone on charge while you record. A night of listening uses more battery." | **Got it** (hides it) |
| P3 | Otherwise | "Add Night Notes before you sleep, so you can track your progress over time." Once added: "Tonight's Night Notes: Blocked nose · Alcohol" | **Add Night Notes** / **Edit Night Notes** |

P3 is always there underneath, so it's also Home's way into Night Notes (there's no separate Night Notes row).

> **Engineering:** P2 could also hide while the phone is already on charge (expo-battery), and come back each evening rather than once.

**Record button:**

- **Tap to start.** The ring of ticks lights up quickly, then recording begins and the screen fills with blue from the button.
- **At rest:** the button breathes very gently, and now and then a light runs round the ring.
- **Under it:** "Tap to start recording", and a quiet pill with a lock: "Private. Recordings stay on this phone."
- **No stop time to set.** Recording runs until the user stops it (section 5.7).
- **Can't start** (not enough space, or the recorder failed): the recording problem screen instead (section 5.12).

### 5.6 Night Notes

A 15-second check-in before recording. Natural questions with tap-to-choose pills, not a form.

| Question | Options |
| --- | --- |
| How are you feeling? | Blocked nose, Sick, Exhausted, Dehydrated, Period |
| Anything before bed? | Alcohol, Caffeine, Ate late, Worked out, Smoking, Sedatives |
| Sleeping somewhere different? | Not my bed |
| Using anything tonight? (remedies, in a sheet) | **Sleep position:** Side sleeping, Wedge pillow, Positional therapy, Anti snore pillow. **Nose:** Nasal strip, Nasal dilator, Nasal spray, Neti pot, Allergy relief. **Mouth & throat:** Mouthpiece, Tongue retainer, Mouth tape, Throat spray, Chin strap. **Room:** Air purifier, Humidifier |

- **"Same as last night?"** appears once there are earlier notes, with **Use previous notes**. A small **Forget previous notes** link clears them.
- **Done · 3 selected** saves the notes; Back leaves without saving.
- Notes attach to the night when recording stops.

### 5.7 Recording

The full rule set and its reasons are in [RECORDING.md](RECORDING.md).

**The rule:** start with a tap at bedtime, stop with a tap when you wake. Nothing to set in between.

| | |
| --- | --- |
| Start | Tap the record button on Home. |
| Stop | Tap the stop button, then confirm: "Stop recording?" / "Airese will look through your night." **Stop recording** · **Keep recording**. |
| After stopping | Straight to Recording Details: "Looking through your night", then the results. |
| Safety net | Stops by itself after **8 hours** (battery and storage). |
| Scheduled start | None: iOS and Android 14+ don't allow switching the microphone on from the background. |
| Alarm | None. Airese doesn't wake anyone. |

**The Recording screen ("Recording…"):**

- **Title:** "Recording…", then "Listening privately, on this phone." with an (i): "How recording works" / "Airese listens through your phone's microphone, even with the screen locked. It keeps short moments of snoring and breathing, and works out your night on this phone. Nothing leaves it unless you choose to share."
- **Tips carousel**: a very light frosted box with a soft shadow, one short line at a time (swipe, or tap the dashes):
  1. "Keep Airese open. Just lock your phone." (the point: don't switch to another app or close Airese)
  2. "Keep your phone on charge."
  3. "No Night Notes yet tonight." with **Add** (opens Night Notes). Once added: "Night Notes added for tonight."
- **Listening ring:** moves with the sound around the stop button, with "Tap to stop recording" right under it.
- **Type:** the title, then one style for everything else (Inter 16 regular). Moon for the tips and the safety stop; Mist for the subtitle. No elapsed timer.
- **Bottom:**
  - An outlined pill: **Stops by itself after 8 hours**. Screen readers hear the exact time.

**Paused:** if recording stopped in the night (another app closed Airese) and the user comes back to Airese, the Recording screen shows the recording problem template instead (section 5.12): **Carry on recording** continues the same night; × stops for the night, with the usual confirm.

> **To confirm (Engineering):** recording must survive a locked screen and Do Not Disturb, and the 8-hour cap must be checked against battery and storage measurements.

### 5.8 Recording Details

The most important screen: one night's results. It is the Reports tab's page (section 5.9): last night by default, any other night from the calendar. Stopping a recording lands here.

#### Page template

- **The calendar button** top right (section 5.9), the night's date as the title ("Tue, 6 Oct"), and, on two lines, "8 hr of recording" / "11:05 pm to 7:05 am". Last night (the night that started yesterday) also has a small Breath **Last night** tag at the end of the first line; other nights have none.
- **A sticky footer** with one next step, shown once the verdict card has scrolled away. It is **the same button as the verdict card's** (label, icon and colour), so the page never offers two different actions: **Keep tracking** (Breath) on ordinary nights, **Try using a remedy** (Lamp) on an unusual night, **Book a call** (coral, call icon) only for a repeated pattern (it opens a sheet: "A sleep care team from The Air Station can go through your recent nights with you and suggest what to do next. It isn't a diagnosis." with **Request a callback** · **Not now**). Under it, "Powered by The Air Station".

#### States

| State | When | What the page shows |
| --- | --- | --- |
| Processing | Straight after stopping | "Looking through your night" / "Finding the moments worth showing you." with a soft progress shimmer. No empty cards. |
| Couldn't hear clearly | Poor audio | The usual header, with the recording problem template in the middle (section 5.12). No cards. |
| Stopped early | The recording stopped in the night | The usual header, with the recording problem template (section 5.12). **See what was saved** then shows the saved part: a "Partial recording · stopped at 2:14 am" note (Lamp icon, faint Lamp pill), the scores if 2 hours or more were saved (no trend line, never compared with your usual), and the night in sound. |
| Ordinary | Close to usual | "A steadier night". Blue card, low calm graph, **Keep tracking**. |
| Unusual | One night out of the ordinary | "More snoring than usual". Warm dusk card, climbing Lamp graph, **Try using a remedy**. |
| Repeated pattern | The same thing on many recent nights | A headline that varies by night: "Time to get this checked", "This keeps happening", "Not just one night" or "Your breathing needs a look". Wine card, drawn Flare climb, **Book a call** (coral). The sticky footer repeats it. |

#### Three levels of detail

| Level | For | What |
| --- | --- | --- |
| Glance | Everyone, at 6 am | Sound Score and breathing pauses · the verdict and its one next step |
| Explore | The engaged user | Your night in sound (chart and clips) · snoring and sleep · recent nights · what it means |
| Report | The curious, and doctors | The night report sheet: zoomable chart, every measure, how it's measured |

#### The page, top to bottom (ordinary, unusual and pattern nights)

1. **Two score tiles, side by side.** Each opens a sheet.
   - **Sound Score:** a big ring with the number inside (e.g. 88), a level word (Low, Moderate, High) and the trend ("More than usual", "About usual", "Less than usual").
   - **Breathing pauses:** a ring with an icon, not a number. A plain level word (Rarely, Sometimes, Often) and the trend. The exact rate per hour is only in its sheet and the night report.
2. **The verdict card.** Full-width words over the night's mood colours, with the week as a graph behind them (no dial).
   - A headline and one short, general line: no numbers or times, 120 characters at most, two lines at most. The numbers live in the cards around it. E.g. "A steadier night" / "Your breathing was steadier than on your recent nights."
   - **The graph** is real data: the last seven nights of snoring, tonight at the right edge. The shape is the data's; how high it reaches follows the verdict: low and nearly flat (ordinary, Breath line), climbing to mid-card (unusual, Lamp line). **Pattern** is drawn, not plotted: a zoomed-out picture of a pattern building up, one steady climb from bottom left to top right with small wobbles (Flare line on wine). The words carry the facts. Hidden from screen readers: the words say it. On load a tiny shine draws the line from left to right (glint preset); after a long rest it glides along the finished line again, now and then. Reduce Motion: the graph is simply there, no shine.
   - **The graph runs behind the words, within a readability budget:** behind the text, the fill (4%) and line (6 to 14%) are held so Moon body text stays at 7:1 or more at the card's brightest point (measured 9:1 or better). Below the text it fades up to full strength behind the button. The card's corner glow was softened to make room. The shine dims behind the words too.
   - **One button,** coloured by the night: **Keep tracking** (Breath) · **Try using a remedy** (Lamp, the one warm light) · **Book a call** with a phone icon (coral `urgentAction`, the one button allowed a red tint; BRAND §4).
3. **Your night in sound.** The chart and the clips in one card.
   - **Opening line,** e.g. "Louder than a conversation for 1 hr 30 min, mostly between 12 and 2 am."
   - **The chart:**
     - the whole night's sound level as a filled shape, against 40, 60 and 80 dB lines;
     - breathing pauses as purple marks above the plot;
     - the moments you can hear as rings on the axis.
     - Tapping anywhere picks the nearest moment and plays it.
   - **The player:** time, what it is, level and length (e.g. "3:48 am · Breathing pause · 34 dB · 14 sec"), then a waveform. A breathing-pause clip frames the **Pause** (dashed purple) and the **Loud breath** after it (solid orange). Then a scrubber and play/pause.
   - **Navigation:** **‹ 2 of 3 ›** steps through the key moments; **All 12 ›** opens every clip.
   - **Key moments:** three, spread across the night (the loudest snoring, a breathing pause, and one more snoring moment far from both). The player opens on the breathing pause, the clearest proof.
4. **Snoring and Sleep tiles,** side by side.
   - **Snoring:** total time (e.g. "4h 57m"), the trend, and small bars by hour.
   - **Sleep:** estimated sleep (e.g. "7h 46m"), a level ("In range"), and a line with gaps where restless.
5. **Your recent nights:** a bar per night for the last 7, tonight highlighted, a line for your usual, and a sentence ("About your usual 4 hr 17 min of snoring.").
6. **What it means.** A warm card whose message follows the ladder (section 7), with an (i) for "How Airese decides what to say".
7. **Night report** card: "Every measure from last night, and how Airese got it. Handy to show a doctor." It previews the loudest level, pauses per hour, and time above 60 dB.
8. **Private by default** footer: "Your recordings stay on your phone." Link: "How Airese keeps it private".

#### Sheets ("more")

| Sheet | Contents |
| --- | --- |
| Sound Score | "88 out of 100", the level and guide, what it's made of (loudness out of 50, snoring out of 50, each with a plain line), the guide scale, a plain explanation. |
| Breathing pauses | Pauses an hour (e.g. "15.6 an hour"), how many in how much sleep, the guide scale, pauses by hour, your usual, "it doesn't diagnose anything". |
| Snoring | Total time and share of the night, the full interactive chart, minutes by hour, intensity split (Light, Moderate, Loud, Very loud), a dB reference list (whisper 30, quiet room 40, conversation 60, vacuum cleaner 75), your usual. |
| Sleep | Estimated sleep, asleep and restless line with restless times, the guide scale, how it's estimated. |
| All clips | The night timeline with tappable clip rings, then every clip as a row with play/pause and a plain label. |
| Your recent nights | The 7-night chart, tonight against your usual for snoring, breathing pauses and loudness. |
| Night report | The full interactive chart; a table of every measure (recorded, asleep, snoring, above 60 dB, average, loudest, breathing pauses and rate, coughs, movements, restless, Sound Score and its parts); every score with its guide scale; how Airese measures; "not a diagnosis". |

#### The interactive chart (in sheets and the night report)

- **What it shows:**
  - the sound level every 20 seconds, as one filled shape through the loudness ramp (cyan at the base, red only for very loud snoring); every other snoring and breathing amount on the page and in its sheets uses the same ramp;
  - a row of events above the plot, each its own shape: breathing pause (purple pill), cough (white diamond), movement (grey ring);
  - a readout above the chart: the loudest moment in view, or the time and level at the playhead, naming any event there.
- **Touch:**
  - drag to move the playhead;
  - pinch to zoom, down to 2 minutes;
  - two fingers to pan;
  - − / + and **Whole night** do the same with one finger.
- **Screen readers:** a summary, and swipe up or down to step the playhead.

### 5.9 Reports

The second tab (it was "Recordings", a list of nights). It opens straight on **the most recent night's report** (Recording Details, section 5.8), so the morning check is one tap.

- **Top right: a calendar button** (in place of the avatar; Profile stays on Home). It drops a **top sheet** down from the top: the bottom sheet's twin, closed by a tap outside, a drag up, or Android back.
- **The calendar:** one month, weeks starting on Sunday.
  - **Header:** "October 2026 ⌄" with ‹ › for months. Tap the month name for a month grid with ‹ › for years; tap a month to go back to its days. Months run from the first recording to this month.
  - **Each recorded night has a ring for its Sound Score**, through the loudness ramp, like the Sound Score tile (fuller is louder). A dashed ring: recorded, but Airese couldn't hear clearly. No ring: nothing recorded.
  - Only recorded nights can be picked; picking one closes the sheet and shows that night's report. The night on show is filled in Breath; today's date is in Breath; days still to come are dimmed.
- **Missed nights:** when 4 or more of the last 14 nights have no recording (product to confirm), a calm note under the calendar: "You recorded 7 of the last 14 nights. A bedtime reminder can help." **Remind me at bedtime** asks for notifications if they're off, then turns the bedtime reminder on. Once both are on, the note goes.
- **No recordings yet:** "Reports" / "Your first report appears here the morning after you record a night." **Record tonight** (to Home).
- **Removed with the list:** the overall insight banner ("Your breathing was steadier this week than last."). Its ladder messages now live in each night's verdict card.

### 5.10 Profile

Account settings, opened from the avatar on Home. One short page of rows; anything with a form or switches opens one level down.

| Section | Rows |
| --- | --- |
| You | Initials (no photo), name and phone (or email) → **Your details**. When empty: "Add your details · Name, phone and a little about you". |
| Sleep care | **Talk to a sleep care team** (dials; shows hours) · **Our centres ›** ("Find The Air Station near you") |
| Settings | **Bedtime reminder** (a switch; "Notifications are off" with **Turn on** while the permission is off) · **Microphone** ("On · needed to record your night", or "Off · Airese can't record without it" with **Turn on**) |
| About | **How Airese works** · **Privacy policy** · **Terms of use** (each in a sheet). |
| Your data | **Delete all recordings** ("12 nights on this phone"; greyed out when none) · **Erase everything and start again** ("Details, recordings, notes and settings"). |
| Brand | The Airese logo in muted grey, "Powered by The Air Station", "Everything Airese keeps is on this phone.", the version. Quiet, at the end. |

**Confirmations.** Both destructive actions confirm first.

| Action | Sheet | After |
| --- | --- | --- |
| Delete all recordings | "Every night's recording and results are removed from this phone. Your details and settings stay. This can't be undone." | A toast: "✓ All recordings deleted". |
| Erase everything | "Your details, recordings, Night Notes and settings are removed from this phone, and Airese starts again from the beginning. This can't be undone." | The app returns to the splash. |

**Your details (page):**

- **Fields:** the same as onboarding (section 5.4): name, phone, email, and the About you tiles (gender, age, height, weight, where you live).
- **Saving:** edits are a draft with a sticky **Save**; Back discards them. Each field is checked when you leave it, and all are checked again on Save.

**Our centres (page):**

- **Header:** "The Air Station sleep care team" / "Talk to someone who can go through your recent nights with you and suggest what to do next."
- **One card per centre:** the area, address, hours, **Call** and **Directions**.
- **Then:** "Not sure which centre? Call us…", and the brand footer.

> **To confirm:**
> - the support number, hours and centre details (placeholders in `src/lib/airStation.ts`);
> - the privacy policy and terms (placeholders);
> - what phone and location are for and when they're shared;
> - listing the nearest centre first once real locations exist.

### 5.11 Notifications

One notification: the bedtime reminder, switched on in Profile → Settings (Oct 2026).

| Notification | Default | When | Example |
| --- | --- | --- | --- |
| Bedtime reminder | Off | Around the user's usual bedtime | "Ready to record tonight?" |

- **Not sent:** "results are ready" (the report appears as soon as recording stops) and "stop recording" (recording stops by itself after 8 hours).
- **Permission:** needs the system permission. While it's off, the row shows **Turn on**; allowing it turns the reminder on.
- **Wording:** follows the "one finding across channels" rule in BRAND.md. Push stays general ("There's a pattern worth looking at this week"); detail lives in the app.

> **To confirm:** exact copy and timing; how the "usual" bedtime is learned.

---

### 5.12 Recording problems

One template for every case, the same as the permission screens (`PromptLayout`): **image, problem, reason, how to solve, one button**. A few words each; the picture does most of the work. Copy and logic: `src/lib/recordingIssues.ts`.

| Case | Where | Problem | Reason | How to solve (Lamp lightbulb) | Button | Top right |
| --- | --- | --- | --- | --- | --- | --- |
| Not enough space | Full screen, on tapping record | Not enough space to record | We need at least 200 MB of space. | Clear files you don't need. | **Try again** (checks again; starts if it can) | × to Home |
| Couldn't start | Full screen, on tapping record | Oops! Couldn't start recording | Something went wrong somewhere. | Close the app and try again. | **Try again** | × to Home |
| Couldn't hear clearly | Reports, that night (usual header) | Couldn't hear clearly | The sound was too faint last night. | Put your phone closer to the bed. | **Record tonight** (to Home) | Calendar |
| Stopped in the night | Reports, that night (usual header) | Recording stopped at 2:14 am | Your phone interrupted it. 3h 9m saved. | Keep it charging, with Do Not Disturb on. | **See what was saved** | Calendar |
| Paused | Over Recording, back in Airese that night | Recording paused at 1:30 am | Another app closed Airese. | Keep Airese open. Just lock your phone. | **Carry on recording** | × stop for the night |

- **Other causes of a stop** share the template, with their own reason, fix and image: another app closed Airese ("Keep Airese open. Just lock your phone."), or space ran out ("Clear files you don't need.").
- **What was saved:** under 2 hours, clips only; 2 hours or more, the scores too. The night never changes the user's usual.
- **Images:** one per case, in the same glowing style as the permission graphics (`assets/problems/`).

> **To confirm (Engineering):** how much space a night needs (200 MB is a placeholder); the shortest stretch worth scoring (2 hours, with Clinical); detecting a failed start, an interruption and the app being closed (AppState, audio interruptions); free space from `expo-file-system`.

### 5.13 App update

A full-screen prompt (`PromptLayout`), **forced for now**: no Skip, no swipe back.

- **Copy:** "Update Airese to keep recording." / "This version is out of date. Your recordings and reports stay on your phone. See what's new in the App Store." ("Google Play" on Android.)
- **Button:** **Update now** opens the store page. What's new is told in the store listing, not here.

> **To confirm (Engineering):** the version check (the server compares the installed version with the oldest supported one); the App Store ID (a placeholder in `src/lib/appUpdate.ts`). Recordings stay through an update (confirmed by Engineering, Oct 2026).

## 6. Measures and how they're calculated

All ranges below are **placeholders for Clinical to confirm**. Words stay calm: no "bad", no "critical".

| Measure | Definition (prototype) | Levels |
| --- | --- | --- |
| **Sound Score** | 0 to 100, lower is quieter. Two halves: **loudness** (average snoring level; 35 dB scores 0, 65 dB or more scores 50) and **snoring** (share of the night; none scores 0, 40% or more scores 50). | Low (under 40), Moderate (40 to 59), High (60 and over) |
| **Breathing pauses** | Pauses per hour of sleep. A pause is counted when snoring stops for a moment and starts again with a louder breath. | Rarely (under 5), Sometimes (5 to 14.9), Often (15 and over) |
| **Snoring time** | Total minutes Airese heard snoring; also as a share of the recording. | Light (under 10%), Moderate (10 to 25%), High (over 25%) |
| **Loudness** | Average level while snoring and the loudest moment, in dB from the phone's microphone. Phones differ, so compare nights, not numbers. | Quiet (up to 45), Medium (to 55), Loud (over 55) |
| **Above 60 dB** | Minutes louder than a conversation. | |
| **Sleep** | Recording time minus stretches that sounded awake or restless. An estimate from sound alone. | Short (under 7 hr), In range (7 to 9 hr), Long |
| **Rest Score** | How settled the night sounded (sleep length, how often snoring or waking broke it up). 0 to 100, higher is better. In the night report only. | Low, Fair, Good |
| **Coughs, movements** | Counts of each event. | |
| **Usual** | The average of the user's own last nights (7 in the prototype). Never other people. | |
| **Trend** | "More than usual" if over 120% of usual, "Less than usual" if under 80%, else "About usual". | |

**Two numbers that need special care:**

- **Pauses per hour with bands at 5 and 15.** These are the clinical cut-offs for mild and moderate sleep apnoea, so the figure will be read as a diagnosis. That's why the main page shows only a plain word and the exact rate sits one level down. Clinical and regulatory must agree before it's shown at all.
- **dB values.** Uncalibrated phone microphones vary. Show them as relative, and say so.

---

## 7. The escalation ladder

Airese gets more direct only as evidence builds up. **Each step unlocks only when the data supports it; Engineering and Clinical set the thresholds.**

| # | Step | Example | Where it shows |
| --- | --- | --- | --- |
| 1 | Notice | You snored for 42 minutes. | Verdict card |
| 2 | Compare | That's more than your usual. | Trends, Unusual state |
| 3 | Spot a pattern | 4 of the last 7 nights. | Pattern state |
| 4 | Explain | Loud, frequent snoring can come with paused breathing. | Sheets, "what it means" |
| 5 | Suggest | Worth mentioning to a doctor. | Pattern state, "what it means" |
| 6 | Help them act | Talk to a sleep care team · Share your report. | Footer button |

**What it means**, by state:

- **Ordinary:** "Nothing unusual stood out."
- **Unusual:** "Something to keep an eye on… One night is hard to read on its own. We'll see how the week looks."
- **Pattern:** "5 of 7 nights" / "Your breathing paused often on 5 of the last 7 nights. This is worth getting checked by a doctor." (the deck's pattern screen, word for word)

---

## 8. Privacy and data

- **Where sound is analysed:** on the phone.
- **Where things are kept:** recordings, clips, details and preferences stay on the device.
- **What is stored:** short clips of the moments that matter, not the whole night. *(To confirm with Engineering: "Only snoring is recorded" must match what's actually stored.)*
- **What the user can delete:** all recordings, or everything (section 5.10).
- **Sharing:** nothing leaves the phone unless the user chooses to share, e.g. asking for a callback or sharing a report (both to design).
- **Wording rule:** privacy is said in one short line, never a wall of text, and never claims more than the architecture does.

---

## 9. Design system and accessibility

Full detail in [BRAND.md](BRAND.md).

| Area | Rule |
| --- | --- |
| Colour | "Night, with one warm light." Midnight background, Deep cards, Moon text, Breath accent, Lamp for the one key highlight. Data colours: Ember for snoring, Iris for breathing, Dew for sleep. Loudness: cyan, yellow, orange, Flare red, pinned to decibels (charts only). **One red, Flare**, for marks only (loudest snoring, the pattern graph, form-error marks), plus one coral button, Book a call on a repeated pattern. See-through tints use `alpha()`. |
| Type | Montserrat for titles and buttons, Inter for reading text; two weights (regular and semibold). Results use four sizes: 32, 20, 16, 14. Nothing under 12 pt. Big numbers have no small units ("7h 36m"). |
| Icons | Material Symbols (Outlined), through the `Icon` component only. |
| Motion | Two presets, `slow` and `fast`, each with ease-out, ease-in and ease-in-out curves, plus `ambient`, `attention`, `glint` and `stagger` helpers. No snapping, bouncing or overshoot. Reduce Motion is always respected. |
| Accessibility | WCAG 2.2 AAA: 7:1 text contrast, 44 pt targets, every chart has a text alternative, colour is never the only cue (shapes and words too), every gesture has a one-finger alternative (e.g. zoom buttons for pinch). |
| Templates | PageTitle (every tab's title row), DetailPage (sticky back or tab page, compact title, optional sticky footer), VerdictCard, DataCard (wide and square), LargeSheet (near full-screen), BottomSheet, TopSheet and ExplainSheet (small), grouped forms (iOS Settings style). Full list: design-system/README.md. |

---

## 10. Technical notes for engineering

- **Stack:** Expo SDK 57, React Native, TypeScript, expo-router. Routes in `src/app/`, screens in `src/screens/`, parts only this version uses in `src/components/`, logic in `src/lib/`; tokens and shared components in `design-system/` next to v1 and v2 (imported as `@ds/...`).
- **No native folders checked in:** `ios/` and `android/` are generated. Configure through `app.json` and config plugins.
- **Sample data (Prototype):** `src/lib/nightDetails.ts` generates each night from its id, so a night always looks the same:
  - the sound level every 20 seconds;
  - snoring stretches and breathing pauses (only during snoring);
  - coughs and movements;
  - clips, with pause and loud-breath marks;
  - scores.

  Replace this with on-device analysis. Every insight needs a confidence threshold and must never turn a low-confidence output into a health statement.
- **Prototype state:** permissions, details, notes and deletions live in a session store (`src/lib/session.ts`). Replace with on-device storage (e.g. SQLite or secure store).
- **Background recording:** must survive a locked screen; foreground service on Android. No scheduled start (platform limits).
- **Permissions:** `expo-audio` (microphone) and `expo-notifications`. The browser preview simulates the system prompts.
- **Data for the interactive chart:** sound level every 20 seconds, plus times of breathing pauses, coughs and movements.
- **Data for clip marks:** for each clip, where in it the pause starts and ends and where the loud breath is.
- **Placeholders to replace:**
  - support and centre details: `src/lib/airStation.ts`;
  - guide ranges: `src/lib/benchmarks.ts`;
  - Sound Score formula: `soundScoreParts` in `src/lib/nightDetails.ts`;
  - privacy policy and terms: `src/screens/ProfileScreen.tsx`.
- **Browser preview:** `preview/index.tsx` mirrors the routes for review; `public/iphone.html` adds the iPhone frame, with every screen and state listed as links in a left pane, and a one-line note under the phone saying what the screen does (and its route, on localhost). It's published to GitHub Pages on every push to `main`.

---

## 11. Success measures

- **Retention:** users record more than one night, and reach three nights (enough for a first comparison).
- **Proof:** the share of morning sessions that play at least one clip.
- **Action:** more users go from a flagged pattern to talking to the sleep care team or sharing a report.
- **Trust:** fewer people turn off notifications or erase everything.
- **First A/B test:** two versions of the "worth getting checked" message.

---

## 12. Decisions and open questions

### Decided (October 2026)

| Decision | Why |
| --- | --- |
| Start now, stop when you wake; 8-hour safety stop; no stop time at bedtime | A stop time is a guess people can't make at bedtime, and stopping too early loses data. The morning stop leads straight to the results. See RECORDING.md. |
| Tap to start (not press and hold) | Simpler. Stopping still confirms, so a stray tap costs nothing. |
| No scheduled start, no alarm | Platform limits; an unreliable alarm would be the worst failure. |
| Scores first, then the verdict | The two numbers people look for sit at the top; the verdict below says what they mean, in plain words, with the next step. |
| Chart and clips merged into one card | The chart is the index of what you can hear. |
| Breathing pauses as a plain word on the page, exact rate one level down | The rate reads as a sleep apnoea index; it needs Clinical and regulatory agreement. |
| Three levels: glance, explore, report | Simple for most, detailed for the curious and for doctors. |
| No red; one orange ramp for loudness | Calm, not alarming; colour-blind safe. |
| "Erase everything" instead of "Delete account" | There are no accounts yet. |
| No photo upload | Out of scope. |

### Open

| Question | Owner |
| --- | --- |
| Can a per-hour breathing figure be shown at all, and with which bands? | Clinical, Regulatory |
| Sound Score formula and all guide ranges | Engineering, Clinical |
| How accurate is pause detection (share of flagged pauses that are real, real ones missed)? | Engineering |
| Clips only, or the whole night? (Decides "tap anywhere to hear".) | Engineering, Product |
| Is "Only snoring is recorded" true? | Engineering |
| What are phone and location for, and when are they shared? | Product |
| Callback flow: contact details, consent, what the care team sees | Product, Clinical |
| Sharing or exporting a report for a doctor | Product |
| Partner sharing of a clip | Product, Privacy |
| Notification copy and timing; onboarding copy still says "two a day" | Product |
| Support number, hours, centre details, privacy policy, terms | Easmed, Legal |
| 8-hour cap against battery and storage | Engineering |
| Medical-device position and disclaimer wording | Regulatory, Legal |

---

## 13. Glossary

| Term | Meaning |
| --- | --- |
| Breathing pause | A moment when breathing sounded paused or uneven while snoring, followed by a louder breath. Counted, not diagnosed. |
| Clip | A short recording of a moment worth hearing (loud snoring, steady snoring, a breathing pause). |
| Key moments | The three clips the page leads with, spread across the night. |
| Night report | The sheet with every measure and how it's measured; for the curious and for doctors. |
| Night Notes | What may affect tonight's sleep (feeling, before bed, somewhere different, remedies). |
| Sound Score | 0 to 100 summary of how loud and how much the user snored. Lower is quieter. |
| Sleep care team | The Air Station's team that can go through recent nights and suggest a next step. |
| The Air Station | Easmed's sleep care service; "Powered by The Air Station". |
| Usual | The user's own recent average. Never other people. |
| Escalation ladder | The six steps from noticing to helping the user act, each unlocked by evidence. |
