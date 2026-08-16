# Assets

Prefer **SVG** for logos/UI, **WebP** for photos/stills, **MP3** for all audio (beds + SFX).

## images/

- `IMAGO.svg` — Empire Imago (boot splash + hub header). Wired via `BOOT_LOGO.src` in `content/boot-content.js`.
- `666face.webp` — clearance `666` easter egg face.
- `banquet.webp` — Imperial bind banquet still (lazy-loaded in `index.html` / `src/imperial.js`).
- `sturm-wireframe.webp` — reference still for Sturm gyro viz (live viz is CSS/SVG).
- `CARAPACE.svg` — Assault Captain-class Carapace top-down plan (Hull Telemetry schematic).

## audio/music/

Beds, ambience, and soundtrack (no spoken dialogue).

- `terminal-ambience.mp3` — site-wide looping terminal hum. Wired via `AMBIENCE.src`.
- `Recursion.mp3` — hub music after pad **512** until Imperial bind. Wired via `MUSIC.tracks` / `hubDefault`.
- `Ascendancy.mp3` — default music after Imperial Clearance. Wired via `MUSIC.postImperialDefault`. Diagnostics Track dropdown can switch beds after clearance.
- `carrier-0979.mp3` — greeting carrier on dial **097.9**.
- `carrier-0333.mp3` — emergency / blood carrier on **033.3** (does not lock).
- `egg-0105.mp3` — easter-egg bed on **010.5** (audio + waveform only; no glow/lock; ±10 hear).
- `egg-0666.mp3` — easter-egg bed on **066.6** (same rules).

## audio/voice/

Spoken / dialogue beds.

- `intercept-message.mp3` — Presage Projection intercept (Celeste message after **097.9** lock).
- `egg-0512.mp3` — easter-egg bed on **051.2** (spoken; audio + waveform only; no glow/lock; ±10 hear).
- `flight-log/` — per-entry Flight Log recordings (see that folder’s README). Wire via `audio` on entries in `content/flight-log-entries.js`.
  - `flight-log/heixin-morse.mp3` — partner Morse for Heixin fragment entry.

## audio/ui-sfx/

All wired from `src/audio.js` as MP3:

- `typewriter-a.mp3` — key click while the UI typewrites text (`typeText`).
- `key-input.mp3` — plays when the user types or backspaces in text fields.
- `channel-switch.mp3` — nav channel change, clearance pad keys, radio tuner arrows.
- `dropdown.mp3` — Guest Channel dropdown, Flight Log journal accordion / entry select, chart planet select, Imperial planet wells.
- `reveal-scan.mp3` — top-to-bottom panel reveal; playback rate stretched to match reveal duration.
- `flog-search-hit.mp3` — Flight Log keyword search when the query returns matches.
- `ui-beep.mp3` — shared button beep (clearance pad, Archives search submit, FTH terminal enter, `data-sfx="click"`).
- `tuner-nudge.mp3` — radio tuner arrow / keyboard dial start (legacy; pad/tuner now use channel-switch).
- `ui-deny.mp3` — locked nav / denied inputs (wrong pad code, journal key, etc.).
- `code-success.mp3` — accepted code entry (clearance pad, STATUS auth codes).
- `imperial-clearance.mp3` — Imperial Clearance grant / imperial milestone stinger only.
- `imago-boot.mp3` — Imago mark after normal boot sequence (rate-matched to on-screen time).
- `imago-reset.mp3` — Imago mark after Imperial purge / reset (rate-matched to on-screen time).

Milestone / select stingers remain synthesized in `src/audio.js`.
