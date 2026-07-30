# Assets

## images/

- `IMAGO.svg` — Empire Imago (boot splash + hub header). Wired via `BOOT_LOGO.src` in `content/boot-content.js`.
- `666face.png` — clearance `666` easter egg face.
- `sturm-wireframe.png` — reference still for Sturm gyro viz (live viz is CSS/SVG).
- `CARAPACE.svg` — Assault Captain-class Carapace top-down plan (Hull Telemetry schematic).

## audio/music/

Beds, ambience, and soundtrack (no spoken dialogue).

- `terminal-ambience.mp3` — site-wide looping terminal hum. Wired via `AMBIENCE.src`.
- `Recursion.wav` — hub music after pad **512** until Imperial bind. Wired via `MUSIC.tracks` / `hubDefault`.
- `Ascendancy.wav` — default music after Imperial Clearance (was `soundtrack.wav`). Wired via `MUSIC.postImperialDefault`. Diagnostics Track dropdown can switch beds after clearance.
- `carrier-0979.mp3` — greeting carrier on dial **097.9**.
- `carrier-0333.mp3` — emergency / blood carrier on **033.3** (does not lock).
- `egg-0105.mp3` — easter-egg bed on **010.5** (audio + waveform only; no glow/lock; ±10 hear).
- `egg-0666.mp3` — easter-egg bed on **066.6** (same rules).

## audio/voice/

Spoken / dialogue beds.

- `intercept-message.wav` — Presage Projection intercept (Celeste message after **097.9** lock).
- `egg-0512.mp3` — easter-egg bed on **051.2** (spoken; audio + waveform only; no glow/lock; ±10 hear).

## audio/ui-sfx/

- `typewriter-a.ogg` — key click while the UI typewrites text (`typeText`).
- `key-input.wav` — plays when the user types or backspaces in text fields.
- `channel-switch.ogg` — nav channel change, clearance pad keys, radio tuner arrows.
- `dropdown.ogg` — Guest Channel dropdown, Flight Log journal accordion / entry select, chart planet select, Imperial planet wells.
- `reveal-scan.wav` — top-to-bottom panel reveal; playback rate stretched to match reveal duration.
- `flog-search-hit.wav` — Flight Log keyword search when the query returns matches.
- `ui-beep.wav` — shared button beep (clearance pad, Archives search submit, FTH terminal enter, `data-sfx="click"`).
- `tuner-nudge.wav` — radio tuner arrow / keyboard dial start (legacy; pad/tuner now use channel-switch).
- `ui-deny.wav` — locked nav / denied inputs (wrong pad code, journal key, etc.).
- `code-success.ogg` — accepted code entry (clearance pad, journal volume keys, STATUS auth codes).
- `imperial-clearance.ogg` — Imperial Clearance grant / imperial milestone stinger only.
- `imago-boot.ogg` — Imago mark after normal boot sequence (rate-matched to on-screen time).
- `imago-reset.ogg` — Imago mark after Imperial purge / reset (rate-matched to on-screen time).

Milestone / select stingers remain synthesized in `src/audio.js`.
