# Playtest checklist — Celeste intercept → clearance

Use a cold reader (friend who does **not** know the pad code).

## Setup

1. Serve the site locally or on your host.
2. Clear their browser data for the origin, or use a private window. Keys to wipe:
   - `lattice.clearance`
   - `lattice.milestones`
   - `lattice.interceptTuned`
   - `lattice.interceptEcho`
   - `lattice.whisperStep`
   - `lattice.whisperDone`
3. Give them **only** the Discord-style post + `intercept.html` URL (no hints).

## Pass criteria

| Step | Pass if |
|------|---------|
| Discord → intercept | Opens intercept in under ~2 minutes from the post |
| Tone | Feels like Celeste / Lattice, not “play my ARG” |
| Open gate | Finds **OPEN CLEARANCE GATE** → pad |
| Code (careful reader) | Guesses **512** from G512 / triad / “three digits” without Whisper |
| Code (skimmer) | Whisper path: please → return to tuner → lock **051.2** → report frequency → sudoku blanks → **512** |
| Second carrier | Discovers **051.2** from Whisper + G512 / “generation” language (not random sweep luck alone) |
| After gate | Sees Flight Log; Impact / recovery-key framing makes sense |
| Share rule | Understands “pass intercept, not session” (ask them) |

## Fail / iterate

- If nobody finds 512 on the pad: strengthen hull-generation language on intercept (still no digits).
- If nobody finds **051.2**: tighten Whisper copy (“generation as a dial mark”) without saying the digits aloud.
- If URL is confusing: make CTA larger; keep one link in Discord.
- If Google-looking: you are not using Docs as the face — stay on `intercept.html`.

## Author note

You cannot fully automate this checklist; run it once with a friend before a wider Lux Mori drop.
