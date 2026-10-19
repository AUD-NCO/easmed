# Recording length

How long a night's recording runs, and why. Decided Oct 2026, after mixed feedback from Product and Engineering on "8 hours", start times and stop times.

## The rule

**Start with a tap at bedtime. Stop with a tap when you wake.** Nothing to set in between.

- **Start:** tap the record button on Home. Recording starts now.
- **Stop:** tap the stop button on the Recording screen, then confirm. You go straight to "Looking through your night", then Recording Details.
- **Safety net:** recording stops by itself after **8 hours** (`MAX_RECORDING_MINUTES` in `src/lib/time.ts`) if nobody stops it. This protects battery and storage.

## Why not ask for a stop time at bedtime

- **Bedtime is the worst moment for a decision.** People don't know when they'll wake, and "8 hours from now" is wrong for anyone who goes to bed late.
- **A stop time set too early loses data.** The end of the night is often where snoring and breathing pauses cluster. Stopping too late costs nothing, because the analysis trims the awake time.
- **The morning stop is the way in.** Waking, tapping stop and seeing your night straight away is the moment the product is built around.

## Why there's no scheduled start

- iOS doesn't let an app switch the microphone on from the background.
- Android 14 and later block starting microphone recording from the background too.

A start time the phone silently ignores is worse than none. The analysis finds when you actually fell asleep, so the start doesn't need to be precise.

## Not an alarm

Airese doesn't wake anyone. Building a reliable alarm is a product of its own, and doing it badly would be the worst failure.

## For Engineering

- **Morning reminder for anyone who forgets to stop.** If recording is still running at the user's usual wake time (learned from previous nights), send one notification: "Still recording. Stop now to see your night." If notifications are off, the 8-hour cap still ends the night.
- **The 8-hour cap is a placeholder.** Confirm it against battery and storage measurements. It could later become a setting in Profile if users ask for one.
- **Recording must survive the screen being locked.** The Recording screen tells users to keep Airese open and lock their phone.
