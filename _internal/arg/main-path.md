# ARG Main Path — Imperial Clearance (author reference)

> Not user-facing. Solutions below are **playtest placeholders** — change in [`content/arg-path.js`](../../content/arg-path.js) and wipe with `?cold=1`.

## Gating (confirmed)

| Channel | Opens when |
|---------|------------|
| STATUS | Pad `512` / boot |
| Flight Log | INNER → click PERSONAL RECORD BAY |
| System Chart | INNER → click STELLAR FIX BAY |
| Imperial Clearance panel | Always (assembler; grant only on correct 9-slot) |
| Archives / Guest | Imperial Clearance granted |

## Puzzle solutions (placeholders)

| ID | Solution | Effect |
|----|----------|--------|
| A | FTH: `/outer` → `ENTR SHIP ID` `G512` → `ENTR KHAN ID` `S. Raei` | Eye armed (`optics`); eye reveals outer marks + right feed |
| B | FTH: `/inner` → `DAMAGED PART SERIALS` / `### ### ###` → `EL0 WL3 NR5` (or compact) | INNER live |
| C | Click STELLAR FIX BAY | System Chart unsealed |
| D | Click PERSONAL RECORD BAY | Flight Log unsealed |

C and D are commutative. Unrecognized input → `CMD <input> NOT RECOGNIZED — TYPE /help FOR COMMAND LIST`.

### `/outer` prompts

1. `ENTR SHIP ID` → `G512` (case-insensitive)
2. `ENTR KHAN ID` → `S. Raei` (spaces/period flexible; not the callsign SOLUS)

### Outer station serials (damage order)

Only non-ok marks participate in the INNER code. Serials are 3 chars (two letters + digit). Sort by `damageOrder`; accept spaced or compact entry.

Shared stamp: **CYCLE 10 · AE 1557** (timestamp differs per station).

| Order | Station | Severity | Serial | Timestamp |
|------:|---------|----------|--------|-----------|
| 1 | ENG·L | crit | EL0 | 03:14:08 UTC |
| 2 | WINGS L | fault | WL3 | 03:29:41 UTC |
| 3 | NDL·R | warn | NR5 | 03:47:19 UTC |

OK stations have no serial. Clicking a damaged mark shows serial + TIME OF DAMAGE (TIMESTAMP / CYCLE / AE).

### INNER bay unlocks

| Bay | Unlock |
|-----|--------|
| STELLAR FIX BAY | `lattice.unlock.cartography` + `hull.chartPuzzle` |
| PERSONAL RECORD BAY | `lattice.unlock.flightlog` + `hull.logPuzzle` |

## 9-slot map (orbital inward → outward)

| Slot | Planet | Journal | Fragment | Volume code | Keywords (fragment entry) |
|------|--------|---------|----------|-------------|---------------------------|
| 1 | Qamor | j-qamor | ▽A1 | 512 | qamor, seed |
| 2 | Ikeph | j-ikeph | ▽B2 | 215 | ikeph |
| 3 | Terra | j-terra | ▽C3 | 320 | terra |
| 4 | Deshret | j-deshret | ▽D4 | 430 | deshret, embrace |
| 5 | Teavicta | j-kaph | ▽E5 | 540 | kaph, teavicta |
| 6 | Uros | j-uros-belt | ▽F6 | 650 | uros, belt |
| 7 | Heixin | j-heixin | ▽G7 | 760 | heixin |
| 8 | Haider | j-spike | ▽H8 | 870 | haider, spike |
| 9 | Vol | j-sturm | ▽I9 | (starts open) | vol, edge |

Chart dossiers show `▽ NN // BIND` for slot index. Sturm moon / Teavicta mystery remain special readouts, not clearance slots.

## Clearance UI

- **3×3 triad grid** of wells (centered in channel)
- Each well: planet token (▽) + fragment field
- Tray lists recovered fragments
- Wrong full assembly → `SEAL HOLDS` briefly (~1.5s), then clears (no per-slot checks)
- Draft placements persist in `lattice.clearance.draft`

## Progress keys

- `lattice.hull` — optics (`/outer`), inner (`/inner`), chartPuzzle, logPuzzle
- `lattice.unlock` — cartography, flightlog
- `lattice.fragments` — recovered fragment ids
- `lattice.clearance.draft` — in-progress slots
- `lattice.clearance` — `imperial` when granted
