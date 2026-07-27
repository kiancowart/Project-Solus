# SOLUS — Internal Lore Index (NOT USER-FACING)

> Agent/developer reference only. Do not link from the site UI, Archives, or Transmissions.
> Source of truth: `lore/` → Obsidian Vault `/Sol System`. Re-read vault for detail; use this for orientation.
> Framework update: 2026-07-23 (Imperial Clearance · Flight Log ARG hub · Obsidian-first story)

---

## Site narrative framework

The website **is** the terminal of **Cara** — a **G512 Carapace-class** Arkhidian Khan-craft, bonded to Khan **Solus**.

- **Setting:** Crashed on **Sturm**, moon of **Uros**. Splinter space; Empire relay dead.
- **Spike:** Nickname for **Solus**; later the name of her gun (**KSP-512 / Spike**) so she remembers her partner.
- **Partner:** Remains **unnamed** until a deliberate Flight Log ARG milestone (`partnerReveal`).
- **Ending intent (unwritten in prose):** Solus chooses **not** to repair Cara for flight back to the Hive. She remains alive (Sturm or elsewhere) — possible table NPC.
- **Tone:** Scarlet faith tech, damaged systems, CRT void. Triangle (▽) = Imperial Triad.
- **Campaigns:** Guest Channel (`GUEST_CAMPAIGNS` in `content/boot-content.js`).

### Locked names

| Thing | Name |
|-------|------|
| Ship OS | **LATTICE.OS** |
| Kernel | **FTHFLL** (Faithfull) |
| Ship | **Cara** (G512 Carapace) |
| Pilot | **Solus** (Khan) |
| Sidearm | **KSP-512** / **Spike** |

---

## Unlock map (ARG → Imperial Clearance)

```text
Celeste intercept  →  pad 512  →  STATUS (blind outer)
        ↓  FTH: /outer (G512 + S. Raei) → eye + outer feed
        ↓  FTH: /inner (damage-order serials) → INNER live
        ↓  Click STELLAR FIX BAY  and/or  PERSONAL RECORD BAY
System Chart dossiers (▽ NN // BIND)  ↔  Flight Log imperial fragments
        ↓
Imperial Clearance 9-slot assemble  →  Archives + Guest Channel
```

Full ARG overview (Discord → Imperial): [`arg/README.md`](arg/README.md) · editable solutions in [`content/arg-path.js`](../content/arg-path.js).

1. **Off-site first** — [`intercept.html`](../intercept.html). Carriers: **097.9** · **033.3**.
2. **Pad `512`** — Opens hub; **STATUS** is the ARG board (Flight Log / Chart sealed until INNER puzzles).
3. **STATUS puzzles** — FTH: `/outer` → `/inner` → click INNER bays for Chart / Log.
4. **Chart + Log** — Planet dossiers teach slot order; journals yield ▽ fragments via exact keywords.
5. **Imperial Clearance** — 3×3 wells (planet + fragment). Wrong bind → `SEAL HOLDS` (brief). Grants `lattice.clearance=imperial`.
6. **Whisper** — Pad guide only; does **not** grant Imperial.
7. **Shareable** — Clues are words/docs; each browser keeps its own progress.

### Milestone audio

Stingers (Web Audio): `milestone`, `reveal`, `imperial` — Her Story / Immortality–inspired pings on recoveries.

---

## Obsidian-first authoring

| What | Where | Rebuild |
|------|--------|---------|
| Archives digests | `lore/Player Facing/*.md` (not Flight Log) → UI: **Ship Memory** | `node scripts/build-lore-catalog.js` |
| Flight Log story | `lore/Player Facing/Flight Log/` | `node scripts/build-flight-log.js` |
| Boot / Whisper / pad | `content/boot-content.js` | — |

Flight Log frontmatter: `writeOrder` (your chronology) vs `tellOrder` (ARG reveal). See `Flight Log/README.md`.

---

## Code layout

```text
src/           ES modules (boot, clearance, whisper, flight-log, …)
content/       boot-content.js · lore-catalog.js · flight-log.generated.js
scripts/       build-lore-catalog.js · build-flight-log.js
assets/        images · audio
_internal/     author docs — lore-index.md · arg/README.md (full ARG)
lore/          → Obsidian Sol System
```

Entry: `index.html` → `src/main.js`

---

## Future hooks (not locked)

Parked Celeste / Nu Lunae / partner-name notes live at the end of [`arg/README.md`](arg/README.md) §7.
