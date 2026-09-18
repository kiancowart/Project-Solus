# Project Solus ARG — Master Guide

Nobody sees this file besides myself. This is the single author document for the ARG, including the path to Imperial Clearance, every code and answer, drop-day pins, and build notes.

**Notable Editable Content:** [`content/arg-path.js`](../../content/arg-path.js) · [`content/boot-content.js`](../../content/boot-content.js) · [`content/flight-log-entries.js`](../../content/flight-log-entries.js)  
**Reset playtest:** `intercept.html` or `index.html` with `?cold=1`  
**House rules:** Share the URL and *methods*, not codes. □ = Celeste · ▽ = Imperial Triad.  

Link that will be Posted : [`intercept.html`](../../intercept.html) 
---

## Table of contents

1. [Site framing](#1-site-framing)
2. [North star](#2-north-star)
3. [Path overview](#3-path-overview)
4. [Step by step — dead drop to Imperial Clearance](#4-step-by-step--dead-drop-to-imperial-clearance)
5. [Codes & answers](#5-codes--answers) *(spoilers)*
6. [How the deep board works](#6-how-the-deep-board-works)
7. [Engagement & funnels](#7-engagement--funnels)
8. [Paste pins](#8-paste-pins)
9. [Cold playtest](#9-cold-playtest)
10. [Writing budget & build phases](#10-writing-budget--build-phases)
11. [Where to edit](#11-where-to-edit)
12. [Parked fiction](#12-parked-fiction)

---

## 1. Site framing

The website **is** the terminal of **Cara** — a **G512 Carapace-class** Arkhidian Khan-craft, originally bonded to Khan **Solus**. Crashed on **Sturm** (moon of **Uros**). 

| Thing | Name |
|-------|------|
| Ship OS | **LATTICE.OS** |
| Kernel | **FTHFLL** (Faithfull) |
| Ship | **Cara** (G512 Carapace) |
| Pilot | **Solus** (Khan) |
| Sidearm | **KSP-512** / **Spike** |
| Partner | **VESPER** (Vol fragment / `partnerReveal`) |

**World writing:** Obsidian vault `lore/` (gitignored). Player-facing mirror: `lore/Player Facing/` — Archives Recovered/Sealed, Planets (Chart), Flight Log drafts. Private vault notes never auto-ship.

---

## 2. North star

**Two tables, one door.** This website will act first as a puzzle to intro the world and then a repository of lore info for Campaign players and oneshot players. They diverge at Guest Channel. We'll also be working on setting up a lore search up. 

You do **not** need everyone to finish Imperial Clearance. You need:

- people who **open** the link
- a smaller set who **clear the pad**
- at least one loud solver who **posts discoveries**

### Hooks (pitch language)

| Hook | What it means | Inspiration |
|------|---------------|-------------|
| **Dead drop** | The link appears like found material — not “hey play my ARG.” (Maybe do it while in VC?) | *I Love Bees*, *Year Zero* |
| **Next verb** | Every beat ends with something to *do*, not a lore essay. | Classic ARG crumbs; *Outer Wilds* |
| **Social proof** | Someone posts a find → lurkers FOMO in. | Discord hunts; table talk |
| **Trespass win** | First five minutes prove “I can break in.” | *Portal* chamber 0 |
| **Negative space** | Solving answers *what* and opens a new *why*. | *Obra Dinn*; *Her Story* |
| **Patron with a debt** | Celeste wants something from *them*. | Session-0 patrons |
| **Soft gate / hard lore** | Easy entry; deep puzzle optional. | ARG funnels; KTANE co-op |
| **Table stake** | Doing this changes how the table treats them. | Prep ARGs that pay off |

---

## 3. Path overview

```text
Private Discord invite
    →  Server pin: half-encoded operator ↔ Celeste exchange + intercept URL
    →  Radio tuner
         097.9  locks  →  Celeste speaks  →  post dial in #signals  →  gate
         033.3  glows  →  blood poem (Whisper may send people here)
    →  Number pad (512)
    →  Cara’s hub
         TERMINAL + STATUS open; Chart / Log sealed until INNER
    →  Chart dossiers (bind order) + Flight Log fragments (well words)
    →  Imperial 9-slot bind (optional depth)
    →  Archives (sparse Ship Memory) + Guest Channel
```

Campaign and oneshot groups share that door, then branch at Guest:

```text
Soft board (STATUS → Chart / Log)
    → Friend-group branch
         ├─ Campaign table → Guest CAMPAIGN 1 (Lux Mori)
         └─ Oneshot table  → Guest Nu Lunae / Enkidu-1
    → Optional Imperial nine (warmer lore for either table)
```

**Handshake** (table stake) = opened intercept, locked **097.9**, reached Cara’s hub (or at least STATUS). Imperial is *not* required for bonded entry.

---

## 4. Step by step — dead drop to Imperial Clearance

Plain-language walkthrough. For exact codes, jump to [§5 Codes & answers](#5-codes--answers).

### Step 1 — Invite them to the private Discord

Post a short invite to the private ops / Lux Mori server (or a tiny ARG channel). Friends Discord only gets the invite — not the intercept URL yet. Goal: get people into the room where the dead drop lives.

### Step 2 — Pin the half-encoded exchange + intercept

Inside the private server, pin a garbled operator ↔ Celeste transcript that *feels* intercepted — not a clean briefing. The intercept link sits inside that exchange. Friends open [`intercept.html`](../../intercept.html) — a radio tuner that looks like found material, not a game menu.

Paste templates: [§8 Paste pins](#8-paste-pins).

### Step 3 — Lock the greeting carrier

Tune to **097.9** and hold until it locks. Celeste speaks, asks operators to post the dial reading in `#signals`, and opens a gate to the number pad.

Optional side path: **033.3** plays a blood poem (glow only — no hard lock). Soft easter-egg beds sit on **010.5 / 051.2 / 066.6**. After the first successful lock, the pad and tuner can hand off back and forth.

### Step 4 — Clear the number pad

Enter **512** on the pad to open Cara’s hub. Fiction should point here with G512 / Imperial Triad language — never pin “the password is 512.”

**Whisper path (for skimmers who fail the pad):** open Kharon-Celeste → ask for help → say **please** → go back to the dial at **033.3** → key **blood** → sudoku blanks read **512** → fill **reward** / answer **no** on the Empress trap → hub opens. Music (**Recursion**) starts with a successful pad entry.

### Step 5 — Wake STATUS through the Terminal

On Cara’s hub, TERMINAL and STATUS are open; Chart and Flight Log stay sealed.

1. Run `/outer` → ship id **G512** → Khan id **S. Raei** (optics / outer damage feed).
2. Run `/inner` → damaged serials **EL0 WL3 NR5** (damage order: ENG·L → WINGS L → NDL·R). INNER goes live.
3. On INNER, click **STELLAR FIX BAY** → System Chart, and **PERSONAL RECORD BAY** → Flight Log.

You can skip straight to `/inner`; it also arms outer/optics if needed.

### Step 6 — Learn bind order on the System Chart

The Chart has nine planet purges plus a free **Sturm** dossier (tutorial). Each purge unlocks a **dossier** that ends on a named Dominion Seal. Those seals teach the Imperial bind **order** (inward → outward): DEVOTION → ERUDITION → RESOLUTION → COMMUNION → JUSTICE → AMBITION → DOMINANCE → SACRIFICE → VENGEANCE.

Soft early loop: Qamor, Ikeph, Terra, then Uros. Outer worlds use the shipped Chart verbs in the codes section. Nu Lunae’s Chart `?` is a oneshot egg — not part of Imperial.

### Step 7 — Recover fragment words from the Flight Log

The Flight Log is a flat chronological list (no per-planet airlocks). Search and browse entries; when you find a fragment word in the prose, **click it** into the Imperial tray.

Soft early loop: claim **STURM** → **HIVE** → **OATH** → **CARA**, then the outer worlds. Fragments are the physical tokens for the wells; dossiers only tell you the order.

### Step 8 — Bind Imperial Clearance

Fill the nine wells **inward → outward**: planet + matching fragment word (HIVE … VESPER). Wrong full bind shakes the wells (deny) — no soft “almost” copy.

Correct bind plays the clearance animation (music out → banquet → music back as **Ascendancy**), unlocks Archives + Guest, and decrypts all Log chrome.

Archives Ship Memory stays **sparse**: a few recovered digests open; searching sealed index terms shows a hit exists but the partition stays locked. Most private vault lore never appears here.

That is the full path from Discord invite to Imperial Clearance. Everything below is reference, ops, and author tooling.

---

## 5. Codes & answers

> Spoilers. Prefer this section over memory when playtesting.

### Quick master

| Channel | Codes / answers |
|---------|-----------------|
| Radio | **097.9** lock · **033.3** blood · eggs **010.5 / 051.2 / 066.6** |
| Pad | **512** · eggs **111 / 222 / 420 / 666** · nice-try **311 / 723 / 814 / 521** |
| Whisper | please → **blood** → **512** → **reward** → **no** |
| Terminal | see **Terminal (FTH)** below |
| STATUS | **EL0 → WL3 → NR5** · bays STELLAR FIX / PERSONAL RECORD |
| Residue crumbs | **215 · 320 · 430 · 540 · 760 · 870 · 980** (flavor tips — not Log locks) |
| Fragments | **HIVE OATH CARA EXILE FAITH STURM SILENCE SPIKE VESPER** |
| Dominion Seals (order) | DEVOTION → ERUDITION → RESOLUTION → COMMUNION → JUSTICE → AMBITION → DOMINANCE → SACRIFICE → VENGEANCE |

Dual layer: **fragment** = diegetic well word (click → tray) · **Chart dossier** = bind order only.  
Flight Log is **flat**. 3-digit residue numbers in STATUS / Terminal are crumbs, not locks.

---

### Intercept / radio

| Code | Role |
|------|------|
| **097.9** | Greeting carrier — **locks**; Celeste; `#signals`; gate to pad |
| **033.3** | Blood poem glow — **no** hard lock; Whisper “answer key” dial |
| **010.5** | Soft egg (music); hear ±10; no lock |
| **051.2** | Soft egg (voice); hear ±10; no lock |
| **066.6** | Soft egg (music); hear ±10; no lock |

Poem (033.3) opens on `THE EMPRESS GIVES HER REWARD` … spilled Whisper answer = **blood**.

---

### Number pad

| Code | Role |
|------|------|
| **512** | Access — opens Cara hub (+ starts **Recursion**) |
| **111** | Dev: full Imperial + STATUS unlocks |
| **222** | Cold reset to pad |
| **420** | `YOU ARE NOT FUNNY` |
| **666** | Eyes / dead silence |
| **311 · 723 · 814 · 521** | `NICE TRY` (not access) |

Never pin “the password is 512.” Fiction points via **G512** / Triad language.

| Clue | Meaning |
|------|---------|
| G512 / generation on the hull | Pad **5-1-2**; Whisper emergency dial **033.3** |
| Three digits / Imperial Triad | Code length |
| “Old keys wake old files” | Flight Log keyword recoveries |

---

### Whisper (KHARON-CELESTE)

| Beat | Accept | Notes |
|------|--------|-------|
| “Do you want the answer?” | Affirmative (`yes`, `ok`, `please`, …) | Soft reject on no |
| “Magic word?” | **please** / **plz** | Skipped if please already said |
| Emergency key | **blood** (exact) | **033.3** alone → “need the key” |
| Sudoku blanks | **512** | Blanks read 5-1-2 L→R, T→B |
| `THE EMPRESS GIVES HER ______` | **reward** | |
| “Does she reward her people?” | **no** (negative) | Yes → laugh lock |
| Early paste | **512** / **g512** | Farewell pipeline |
| `who are you` | — | `TURN AROUND` |
| Forbidden name | **Kian** | `Don't say that name.` |

---

### Terminal (FTH) — all inputs

| Input | Prompt / follow-up | Answer / result |
|-------|--------------------|-----------------|
| `/help` | — | Lists cmds |
| `/outer` | `ENTR SHIP ID` → `ENTR KHAN ID` | Ship **G512** → Khan **S. Raei** (spaces/period optional: `S RAEI`, `S.RAEI`) → optics |
| `/inner` | `DAMAGED PART SERIALS` | **EL0 WL3 NR5** (compact ok). Also arms **outer/optics** if not done. INNER live shows Ikeph crumb **215** |
| `/landing` or `/land` | — | Landing profiles: MARKED BERTH · ROUGH TERRAIN · NEUTRAL (Qamor Chart uses **ROUGH TERRAIN**: **L-2 → L-1 → L-3 → L-5**) |
| `/echo` | — (needs INNER) | Damage times + Heixin volume **760** + serials |
| `/translate` | optional string | Empire blood phrase + partner Morse lexicon |
| `/passage` | — | Ikeph Empress / blood verse dump |
| `/fragment` | — | Usage |
| `/fragment <planet>` | — | Confirm fragment **only after** claim |
| `Celeste` (no slash) | — | **Turn around.** (no unlock) |

Shipped help line: `/help · /outer · /inner · /landing · /fragment · /echo · /translate · /passage`

**Removed Terminal cmds:** `/whoami` · `/catalog` · `/orbit` · `/seal` · `/protocol` · `/moon` · `/edge` · `/volume` (renamed `/fragment`).

---

### STATUS — serials & bays

Damaged order for `/inner`: **EL0** (ENG·L) → **WL3** (WINGS L) → **NR5** (NDL·R). Epoch: Cycle **10**, **1557** AE.

| Station | Serial | Notes |
|---------|--------|-------|
| ENG·L | **EL0** | Damage #1 |
| WINGS L | **WL3** | Damage #2 |
| NDL·R | **NR5** | Damage #3 |
| FWD·CAM | FC1 | Ok / flavor |
| NDL·L | NL2 | Ok / flavor |
| WINGS R | WR4 | Ok / flavor |
| MSL·TOP | MT6 | Flavor |
| AFT·CAM | AC7 | Flavor |
| ENG·R | ER8 | Flavor |

| Bay | Unlocks |
|-----|---------|
| **STELLAR FIX BAY** | System Chart |
| **PERSONAL RECORD BAY** | Flight Log |

After `/inner`, INNER is a small diagnostic theater (telemetry / bay drama)—not two naked buttons. Chart and Log stay bay rewards.

---

### System Chart — seal order + puzzle answers

Bind order = inward → outward (named Dominion Seals). Chart unlocks **dossiers** (order), not volume codes. All nine planet purges are **shipped** (`CHART_PUZZLES` in `arg-path.js`).

| # | Planet | Seal | Type | Answer |
|--:|--------|------|------|--------|
| 1 | Qamor | DEVOTION | `sequence` | **L-2 → L-1 → L-3 → L-5** (`/landing` ROUGH TERRAIN) |
| 2 | Ikeph | ERUDITION | `reorder` | Blood hymn lines in `/passage` order (glyph → clear) |
| 3 | Terra | RESOLUTION | `chrono-rings` | Align hours + minutes to real local time → COMMIT |
| 4 | Deshret | COMMUNION | `text` | **All our blood is red** (Empire phrase; also `/translate`) |
| 5 | Teavicta | JUSTICE | `cardinal-eye` | Look **E → W → N → S** |
| 6 | Uros | AMBITION | `text` | **Zezura** (old designation) |
| 7 | Heixin | DOMINANCE | `morse-translate` | Pad `../--/../.../.../..-` → plaintext **I MISS U** |
| 8 | Haider | SACRIFICE | `lights-out` | **3×5** all-lit — press **01 · 04 · 05 · 09 · 10 · 12** |
| 9 | Vol | VENGEANCE | `orbit-order` | Need **3** other dossier purges → tray chips onto bar **inner→outer** |

**Sturm** (Uros moon) dossier is free — tutorial shape, no Chart purge. Chart `?` (Teavicta mystery) = Nu Lunae egg (not Imperial).

**Residue crumbs (flavor only — do not unlock dossiers or Log chapters):**

| Crumb | Where it appears |
|-------|------------------|
| **512** | Pad / ship id (also Qamor flavor) |
| **215** | INNER live telemetry · `CANOPY CHECKSUM · IKEPH VOL 215` |
| **320** | Diegetic scrap in Log / lore (Terra) |
| **760** | `/echo` time rule |
| **870** | INNER · `SIDEARM PLATE · KSP-512 · CODE 870` |

**Retired Chart verbs (do not chase):** flare **B→A→C** / `/whoami`, cradle assemble **FC1·NL2·WR4**, shadow dial tick **5**, text **VX-48** / **hold fast** / **prickly**, Heixin serial echo as Chart answer.

---

### Flight Log — keywords → fragments

| Planet | Keywords (bind) | Fragment |
|--------|-----------------|----------|
| Qamor | qamor, hive | **HIVE** |
| Ikeph | ikeph, oath | **OATH** |
| Terra | terra, cara | **CARA** |
| Deshret | deshret, exile | **EXILE** |
| Teavicta | teavicta, faith, kaph | **FAITH** |
| Uros | uros, sturm | **STURM** |
| Heixin | heixin, silence | **SILENCE** |
| Haider | haider, spike | **SPIKE** |
| Vol | vol, vesper | **VESPER** (partner) |

Other searchable prose hooks (not locks): **wake**, **dust**, **cowboy**, **kaph**, **plate**, **gunsmith**, **crossing**.

Claim: click fragment word/chip → Imperial tray → wells in Chart seal order.

---

### Imperial wells (inward → outward)

| # | Planet | Frag | Keywords |
|--:|--------|------|----------|
| 1 | Qamor | **HIVE** | qamor, hive |
| 2 | Ikeph | **OATH** | ikeph, oath |
| 3 | Terra | **CARA** | terra, cara |
| 4 | Deshret | **EXILE** | deshret, exile |
| 5 | Teavicta | **FAITH** | teavicta, faith, kaph |
| 6 | Uros | **STURM** | uros, sturm |
| 7 | Heixin | **SILENCE** | heixin, silence |
| 8 | Haider | **SPIKE** | haider, spike |
| 9 | Vol | **VESPER** | vol, vesper |

Music: **Recursion** from pad **512** until Imperial bind; silence during UNLOCK SEALS; **Ascendancy** after banquet loads. Diagnostics **Track** dropdown (post-Imperial) switches beds. Music slider mutes.

---

### Guest / persistence

| Item | Notes |
|------|-------|
| CAMPAIGN 1 | “We're waiting.” |
| Corrupt sub-label | `▓█░4F2·92A` until Imperial |
| Nu Lunae | Chart `?` / oneshot — Phase C |

Wipe keys (`?cold=1`): `lattice.interceptTuned`, `interceptEcho`, `whisperStep`/`Done`, `hull`, `unlock`, `milestones`, `journals`, `fragments`, `planets`, `descrambled`, `clearance` + `.draft`.

---

## 6. How the deep board works

### Two layers, not one

| Layer | Format | Role |
|-------|--------|------|
| **Fragment** | Short **diegetic word** (`HIVE`, `VESPER`…) | Imperial well payload — find in Log prose, **click-to-tray** |
| **Chart dossier** | Liturgical seal prose | Bind **order** only (unlocked per-world Chart puzzle) |

```text
Planet Chart puzzle → Sturm-style dossier (seal ORDER only)
Flight Log prose → keyword / browse → click fragment word/chip → tray
    → Chart Dominion Seal order → Imperial wells
```

- **Chart puzzle** = you *earned* the dossier (named seal / bind order).
- **Fragment word** = physical token for the wells.
- **`/fragment <planet>`** = confirms a claimed fragment (not an unlock).

Good: browse Log → find **HIVE** → click into tray; Chart Qamor purge for DEVOTION order.  
Bad: treat STATUS checksums as journal passwords.  
Social: share **method** (“unlock Chart dossiers for seal order”), not leftover crumb digits.

### Chart order — Dominion Seals

Do **not** use elemental key doors. Wrong diegesis.

Do use a Signalis-*shaped skill* (collect motifs → sort by known grammar):

- True bind order = **inward → outward** (already slots + orbits).
- Each dossier ends on a **named Dominion Seal** (DEVOTION…VENGEANCE) in liturgical prose — not Latin ordinals.
- **Sturm** is free (tutorial). The Nine each have a Chart purge (all shipped).
- Chart rings are secondary confirmation; dossiers are the shareable method.

### Terminal as ship OS

Terminal is Cara’s OS with purposeful instruments only — not a STATUS minigame and not a Chart flag gate. Draft dossier copy in `lore/Player Facing/Planets/`; live fields in `PLANET_DOSSIERS` / `SYSTEM_CHART.sturm` (`content/chart-content.js`).

### Easter eggs (optional depth)

- Chart Teavicta `?` mystery → Nu Lunae / Enkidu-1 blurb (oneshot hook) — Phase C copy
- Terminal “Turn around” on Celeste — shipped
- Soft radio beds **010.5 / 051.2 / 066.6**
- Corrupt Guest sub-channel flavor until Imperial

---

## 7. Engagement & funnels

### Problem / solution

| Problem | Solution |
|---------|----------|
| Reads as “Kian’s homework,” not an event | Lux Mori / ops server as home; friends Discord only gets a short invite. Dead-drop pin, not a lore dump. |
| Friends won’t self-organize co-op | Scheduled 20–30 min VC premiere; pin says “two operators.” You catalyze the first `#signals` post. |
| Funnel feels like it requires Imperial | Soft gate = handshake. Pitch that. Imperial is optional depth. |
| `#signals` has no infrastructure | Dedicated channel + pin before drop day; you online for first lock; in-character react once, no spoilers. |
| Binary-first walls casual friends | Intercept URL first; binary only as in-server recovered traffic later. |
| Stake feels fake if campaign hasn’t started | Name a concrete session-one difference *now* (bonded vs unsecured). Use the wait as drip time. |
| One loud solver dependency | Catalyze for 48 hours; later appoint a “signals officer”; share *methods*, not codes. |
| Long build still unfinished | Three-phase drip — handshake live early; deep board in waves; Guest payoffs when ready. |
| Two friend groups need different products | Same ARG front door; diverge at Guest — CAMPAIGN 1 vs Nu Lunae / Chart mystery. |

### Follow-on rules

- First reward must arrive **fast** (glow, lock, Celeste, gate).
- Public proof beats private progress (one `#signals` screenshot > one more hidden layer).
- Never advertise “finish all nine” as entry.
- Share **method**, not codes.

### Campaign vs oneshot

| | Campaign group | Oneshot group |
|--|----------------|---------------|
| Shared door | Intercept → pad → Cara → STATUS | Same |
| Guest promise | Lux Mori warmth / bonded operators | Expedition / Enkidu-1 framing |
| Guest UI today | CAMPAIGN 1: “We're waiting.” | Chart `?` / Terminal egg → dossier when built |
| Must finish Imperial? | No | No |

**Primary drop home:** Lux Mori (or tiny ops) server with pin + `#signals`.  
**Friends Discord:** short invite only — not the full ARG.

### Table stake (handshake = warm entry)

| If they finished the handshake | If they didn’t |
|--------------------------------|----------------|
| Guest Channel treats them as operators who answered the bleed | Unverified traffic |
| Cara / Lattice can be a shared prop | No free terminal unless a bonded friend shares |
| Celeste’s “ping” is live in the fiction | No ping for them |
| Soft perk: warmer trust, open-door framing | Soft cost: colder first NPC, delayed dossier, enter mid-scene |

Be kind to busy friends — invite them to open the node between sessions.

---

## 8. Paste pins

### Friends / DMs — invite only

```
Something answered on a frequency that isn't ours.
Join the node room — do not reply on this frequency.

[DISCORD INVITE]
```

### Private server pin — half-encoded exchange + intercept

```
AUX BLEED // FORWARD INTACT
CHANNEL: ▓▓097.9▓▓ · DO NOT REPLY

[garbled carrier]
OP:    who is this
CEL:   □□□□□□□□ // C█L█ST█
OP:    say again
CEL:   ▓▓ greeting carrier ▓▓ lock ▓▓ then the gate
OP:    what gate
CEL:   open the node. two operators. one dial / one reading.
CEL:   post the dial in #signals after lock.
CEL:   operators who finish sit warmer at Guest Channel.
       the rest arrive unsecured.

Open the node:
[INTERCEPT URL]

[end bleed]
```

### Lux Mori / ops — same pin, campaign framing

```
AUX BLEED // GUEST CHANNEL STATIC

An intercept surfaced on a frequency that isn't Lux Mori's table —
but Guest Channel is sealing other campaigns, and the static may brush this server.

[garbled carrier]
OP:    who is this
CEL:   □□□□□□□□ // C█L█ST█
CEL:   ▓▓ greeting carrier ▓▓ lock ▓▓ then the gate
CEL:   open the node. finish the handshake. search what Lattice still remembers.

Open the node:
[INTERCEPT URL]

After the greeting carrier locks — post the dial reading in #signals before you take the gate.
Handshake complete → bonded. No handshake → unsecured. Guest Channel stays colder.

📌 Pin this in #signals / #intercepts for late joiners.
```

### Before you pin

- [ ] Friends get **invite only**; intercept lives inside the private server
- [ ] Pin reads as a dead-drop transcript, not a content drop
- [ ] Half-encoded Celeste lines · **Open the node** · two operators · `#signals`
- [ ] Bonded vs unsecured — and you mean it at the table
- [ ] No spoiling `512`, “try G512,” or **033.3** in chat

---

## 9. Cold playtest

### Phase A

1. Friends invite → private server pin (half-encoded exchange + intercept)  
2. Lock **097.9**, see `#signals` line, take gate  
3. Could post the dial  
4. Pad **512** (G512 or Whisper path)  
5. Hub with STATUS; Log/Chart locked  
6. `/outer` + `/inner`, click INNER bays  
7. Optional: fragments / Imperial fail or success  
8. Archives: recovered digests open after Imperial; sealed index hits stay locked  

### Phase B

1. `?cold=1` wipe (clears obsolete fragment drafts)  
2. Handshake → pad → `/outer` → `/inner` → both bays  
3. Terminal: `/help`, `/landing`; type `Celeste` → “Turn around.”  
4. Sturm free on Chart; browse Log → claim **STURM**  
5. Search `hive`/`qamor` → claim **HIVE**; Chart landing sequence → DEVOTION  
6. Browse Ikeph scrap → claim **OATH**; Chart blood hymn → ERUDITION  
7. Browse Terra scrap → claim **CARA**; Chart chrono rings → RESOLUTION  
8. Smoke-test outer purges: Deshret phrase · Teavicta eye · Uros **Zezura** · Heixin Morse · Haider lights · Vol orbit tray  
9. Infer bind **order** from unlocked dossiers; partial Imperial bind (wrong seals = deny-shake)  

If the first ten minutes feel stingy, intrigue fails.

---

## 10. Writing budget & build phases

### Writing budget

Target **discovery density**, not novella length.

| Tier | Guidance |
|------|----------|
| Non-Uros entry | ~80–150 words; one beat; one searchable hook |
| Uros / Sturm arc | 4–7 entries can run longer; tutorial + emotional present |
| Minimal path | ~1,500 words reading in a 2–3 hr experience |
| Full Imperial | ~4,000–6,000 words; reading stays minority of play time |

If an entry wants >200 words: split, or move to Archives / Guest. Imperial bind entries stay mechanical. Stingers fire on **recovery**, not unlock. Fragment claim is a separate click.

### Build phases A / B / C

| Phase | When | Player-facing | Your focus |
|-------|------|---------------|------------|
| **A — Handshake live** | Shipped | Pin + intercept + pad + STATUS `/outer`/`/inner` + bays | Sensory win; VC premiere; `#signals` |
| **B — Soft board** | Shipped | Flat Log + click-to-tray + **all nine** Chart purges + Terminal hub | Playtest; dossier copy; residue crumbs as flavor only |
| **C — Table polish** | Before session 0 | Nu Lunae / Guest campaign vs oneshot copy; writing density | Heavy spans; bonded vs unsecured stake |

**Public promise = Phase A.** Never gate friendship on Phase C.

**Explicitly Phase C:** Nu Lunae egg copy, Guest campaign vs oneshot split, writing budget, **VESPER** partner reveal polish. Chart puzzle verbs themselves are already shipped — do not reinstate volume airlocks or retired Chart types.

### Success criteria

- Friends can invest in **Phase A** in one evening without waiting for Imperial.  
- Chart puzzles yield bind **order** (dossiers); Log prose yields **fragments** (click-to-tray).  
- Terminal feels like Cara’s OS with purposeful instruments only.  
- Campaign and oneshot groups share the door, diverge at Guest.  
- This file is the single source of author truth.

---

## 11. Where to edit

| What | Where |
|------|--------|
| STATUS / Imperial / FTH / blood poem | [`content/arg-path.js`](../../content/arg-path.js) (`BLOOD_LYRICS`, …) |
| System Chart dossiers / Sturm / Chart puzzles | [`content/chart-content.js`](../../content/chart-content.js) — draft in `lore/Player Facing/Planets/` |
| Pad, Whisper, Guest, boot, ambience | [`content/boot-content.js`](../../content/boot-content.js) |
| Flight Log stories (+ `audio` paths) | `content/flight-log-entries.js` (live). Draft in Obsidian; promote manually — see `lore/Player Facing/Flight Log/README.md` |
| Archives Ship Memory digests | `lore/Player Facing/Archives/` → `node scripts/build-lore-catalog.js` |
| Radio freqs / eggs | `src/intercept.js` |
| Broader world (private + promote rules) | Obsidian vault `lore/` · authoring contract: `lore/Player Facing/README.md` |

---

## 12. Parked fiction

Not canon until written:

- Celeste as Hive Kharon/Engine mind; Whisper is the live face today  
- Nu Lunae / Enkidu-1 oneshot bridge via Guest / Chart mystery  
- Partner name **VESPER** via Flight Log `partnerReveal` / Vol fragment + `reveal` stinger  
