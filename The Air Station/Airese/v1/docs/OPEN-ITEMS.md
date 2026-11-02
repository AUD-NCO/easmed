# Airese v1: open items and decisions to make

A record only, as of 2 Nov 2026. A sweep of v1, the design system, the PRD's open table, BRAND.md and the
2 Nov team meeting. No action taken on these yet. Owners in brackets are suggestions.

1. Delete account: removed from v1, but Jonas is building account deletion for PDPA. Does beta have it? [Management / Jonas]
2. "Use a remedy" button on Moderate nights: keep, or pull as "implies an unbuilt feature"? [Management]
3. Callback has three entry points (report, Profile, Our centres); the CRM plan assumes two. [Shane / Management]
4. Profile and Our centres still use the old thank-you sheet, with no data-sharing notice. Match the report's confirm sheet? [Kedar]
5. Which night the Profile callback sends (not tied to a night). [Shane]
6. CRM payload draft for CCC (score, pauses, duration, date). [Shane]
7. "Within 3 working days" agreed vs "no hard-coded 3 days": pick one. [Kedar]
8. "Recordings stay on your phone" conflicts with the callback sharing data (onboarding slide, microphone permission screen and sheet, web permission prompt, "Private by default" sheet, phone number "why we ask"). [Kedar / Management]
9. Results screen order (breathing pauses → snore insight → CTA): not built yet; for Irvin on Tuesday. [Kedar / Raena / Shane]
10. Irvin wants breathing pauses loudest; Gary wants the CTA loudest. [Management]
11. Breathing pause sheet claims "most sleep apps don't" do this: needs sign-off. [Management]
12. Breathing pause thresholds for the tiers (now under 5 / 5–14.9 / 15+). [Jonas]
13. Snore Score bands (0–35 / 36–70 / 71–100) are provisional; the formula itself is a placeholder. [Jonas / Clinical]
14. Verdict copy by cause (snoring, pauses, or both): Severe copy assumes pauses today. [Shane]
15. Base copy for all night states, reviewed in Excel with Irvin and Gary. [Shane / Raena / Management]
16. Can a per-hour breathing figure be shown at all, and with which bands? [Clinical / Regulatory]
17. Pause detection accuracy (false and missed pauses). [Jonas]
18. Sleep card shows time recorded, not sleep: flagged at the stakeholder review, never resolved. [Management / Jonas]
19. Loudness levels in the Night report are placeholders. [Clinical / Engineering]
20. Hide Listen and the waveform player when audio is deleted, in the build. [Jonas]
21. Delete sheet wording differs slightly from the copy agreed in the meeting. [Kedar]
22. Is "only snoring is recorded" true? [Engineering]
23. Clips only, or the whole night's audio? Decides "tap anywhere to hear". [Engineering / Product]
24. PDPA: split PII across tables (max 3 per table). [Shane]
25. Bedtime reminder time: shown as 10 pm, marked "still to be decided". [Product]
26. Notification copy and timing; code still describes "two a day". [Product]
27. Support number, hours, centre addresses: all placeholders ("Address to come"). [Easmed]
28. Privacy policy and Terms: placeholder pages, no published URLs. [Legal]
29. Medical-device position and disclaimer wording. [Regulatory / Legal]
30. App Store ID for the forced-update screen (`TODO(engineering)`). [Engineering]
31. Disk space needed per night, and the shortest readable recording: placeholders. [Engineering / Clinical]
32. 8-hour recording cap against battery and storage. [Engineering]
33. Onboarding (i) sheet content is a placeholder "until the sheet design lands". [Kedar]
34. Prompt template artwork: "Image to come" fallback where there's no art. [Kedar]
35. Gary's recording-screen concern: raised, no detail captured. [Management]
36. BRAND.md sign-off pending: the four principles, the mood, confidence thresholds for the ladder. [Management / Engineering]
37. BRAND.md open questions: Navy in the app, splash blues (palette or splash-only), a data monospace font. [Kedar / Management]
38. PRD "Decided" table is stale: still says "Erase everything instead of Delete account (no accounts yet)". [Kedar]

Also in the code: about 15 "Engineering:" notes describing how prototype stubs become real (on-device
storage, the email code server, audio playback, real recordings, scheduling the reminder, the full country
list). Build tasks, not decisions.
