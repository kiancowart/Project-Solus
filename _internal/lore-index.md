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
Celeste intercept (intercept.html)  →  Discord share node
        ↓
Clearance pad (512 via G512 / triad) →  enter Cara
        ↓
Flight Log milestones   →  keyword search recovers journals
        ↓
Partner-name beat       →  major reveal (when you write it)
        ↓
Imperial Clearance      →  Archives digests + Cartography + Guest Channel
```

1. **Off-site first** — [`intercept.html`](../intercept.html) / [`_internal/arg/celeste-intercept.md`](arg/celeste-intercept.md). Discord templates in [`arg/discord-post-template.md`](arg/discord-post-template.md).
2. **Pad `512`** — Intro only. Opens limited hub; **Flight Log is the ARG board**.
3. **Flight Log** — Each recovered entry is a story beat + next step. Search keywords unlock partitions (`lattice.milestones`).
4. **Imperial Clearance** — Finale entry (`sturm-clearance`, keywords `carapace` / `imperial`) sets `localStorage["lattice.clearance"]="imperial"`. Legacy `"deep"` still counts.
5. **Whisper (Kharon-Celeste)** — Pad guide only; does **not** grant Imperial Clearance.
6. **Shareable** — Clues are words/docs friends can pass; each browser keeps its own progress.

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
_internal/     author docs (this file, ARG stubs)
lore/          → Obsidian Sol System
```

Entry: `index.html` → `src/main.js`

---

## Future hooks (not locked)

See `_internal/arg/future-hooks.md` — Celeste / Hive Kharon, Nu Lunae expedition ↔ Solus.

Off-site poem stub: `_internal/arg/offsite-poem-stub.md`
