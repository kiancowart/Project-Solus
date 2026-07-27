# Project Solus ARG — Author Overview

This is your one map of the whole ARG. Friends never see this file.

**What players experience, in order:** a weird Discord link → a radio tuner → Celeste’s message → a number pad → Cara’s broken terminal → optional deep Imperial puzzle.

**Where to change things in code:**
- Puzzle answers / Imperial slots → [`content/arg-path.js`](../../content/arg-path.js)
- Pad, Whisper, boot text → [`content/boot-content.js`](../../content/boot-content.js)
- Blood poem timing → [`content/blood-lyrics.js`](../../content/blood-lyrics.js)

**Reset a playtest:** open `intercept.html` or `index.html` with `?cold=1`.

---

## Why anyone keeps going

Friends don’t quit because a puzzle is hard. They quit because nothing feels unfinished in a way that *matters*. Good ARGs and mystery games manufacture that feeling on purpose.

| Hook (use this language when you pitch) | What it means | Inspiration |
|-----------------------------------------|---------------|-------------|
| **Dead drop** | The link appears like found material — not “hey play my ARG.” | *I Love Bees*, *Year Zero* |
| **Next verb** | Every beat ends with something to *do*, not a lore essay. | Classic ARG crumbs; *Outer Wilds* loop |
| **Social proof** | Someone posts a find → lurkers FOMO in. | Discord hunts; table talk at a TTRPG |
| **Trespass win** | First five minutes prove “I can break in.” | *Portal* chamber 0; *The Witness* tutorial island |
| **Negative space** | Solving answers *what* and opens a new *why*. | *Return of the Obra Dinn*; *Her Story* |
| **Patron with a debt** | Celeste wants something from *them* — transactional, incomplete, a little threatening. | Good session-0 patrons, not town criers |
| **Soft gate / hard lore** | Easy entry for the table; deep puzzle optional. | ARG funnels; KTANE-style co-op roles |
| **Table stake** | Doing this changes how Lux Mori treats them. | Session-0 prep ARGs that actually pay off |

You do **not** need everyone to finish Imperial Clearance. You need: people who **open** the link, a smaller set who **clear the pad**, and at least one loud solver who **posts discoveries**.

---

## The path at a glance

```text
Discord (pin only the intercept URL)
    →  Radio tuner
         097.9  locks  →  Celeste speaks  →  post dial in #signals  →  gate arrow
         033.3  glows  →  blood poem (Whisper may send people here)
    →  Number pad (512)
    →  Cara’s hub
         STATUS puzzles unlock Chart + Flight Log
    →  Imperial 9-slot (optional depth)
    →  Archives + Guest Channel
```

**Two public pages**

| Page | What it is |
|------|------------|
| [`intercept.html`](../../intercept.html) | The Celeste node — **this** is what you post |
| [`index.html`](../../index.html) | Number pad + Cara’s terminal |

**House rules**
- Friends share the **URL**, not their browser save data.
- After someone has locked **097.9** once: pad **←** goes back to the tuner; tuner **→** goes back to the pad.
- **□** = Celeste. **▽** = Imperial Triad elsewhere.

---

## Act 1 — The Discord drop

### Hook: dead drop + one clear verb

Do not announce homework. Frame contamination: something bled onto *their* server. End with one action — **Open the node.**

Same spirit as classic ARG “here’s a URL / phone number / USB” drops: the object is the invitation.

### Hook: two operators (KTANE energy)

Say it in the pin: one person on the dial, one reading. Social games beat solo homework for Discord friends.

### Copy you can paste — friends / DMs

```
AUX BLEED // FORWARD INTACT

Something answered on a frequency that isn't ours.
Do not reply on this frequency.

Two operators recommended: one on the dial, one reading.

Open the node:
[INTERCEPT URL]

After the greeting carrier locks — post the dial reading in #signals, then take the gate.
Operators who finish the handshake sit warmer at Guest Channel. The rest arrive unsecured.
```

### Copy you can paste — Lux Mori server

```
AUX BLEED // GUEST CHANNEL STATIC

An intercept surfaced on a frequency that isn't Lux Mori's table —
but Guest Channel is sealing other campaigns, and the static may brush this server.

Forward intact. Do not reply on this frequency.

Two operators recommended: one on the dial, one reading.
Open the node. Finish the handshake. Search what Lattice still remembers.

Start here:
[INTERCEPT URL]

After the greeting carrier locks — post the dial reading in #signals before you take the gate.
Handshake complete → Guest Channel treats you as bonded operators at session start.
No handshake → you arrive unsecured. Guest Channel stays colder.

📌 Pin this in #signals / #intercepts for late joiners.
```

### Hook: social echo (visible other minds)

After **097.9** locks, the page itself says to report the dial to **#signals**, then take the gate. That first public post is the Discord multiplier — FOMO for people who were lurking.

| Beat | What happens |
|------|----------------|
| Lock **097.9** | On-screen: report the locked dial to `#signals`, then take the gate |
| Someone posts | Screenshot or typed `097.9` |
| Optional freebie | You reply once in-character as Kharon-Celeste to the first poster (never spoil the pad code) |

The gate still works if they skip posting. The pin + on-page line make posting the *expected* next move.

### Before you pin

- [ ] Only the intercept link
- [ ] Sounds like a dead drop, not a content drop
- [ ] Says **Open the node**
- [ ] Mentions two operators
- [ ] Mentions `#signals`
- [ ] Mentions bonded vs unsecured — and you mean it at the table
- [ ] No spoiling `512`, “try G512,” or **033.3** in chat

---

## Act 2 — What Lux Mori owes them

### Hook: stakes inside the campaign

If solving Solus doesn’t change how they show up at your table, intrigue leaks. TTRPG DMs who run “session 0 ARGs” only win when the puzzle is diegetic prep — not optional flavor.

**In one line:** people who finish the handshake sit warmer at Guest Channel. Everyone else arrives unsecured.

**“Handshake” for session one** means: they opened the intercept, locked **097.9**, and got into Cara’s hub (or at least STATUS). The big Imperial puzzle is *not* required for that warmth. Soft gate, hard lore.

| If they finished the handshake | If they didn’t |
|--------------------------------|----------------|
| Guest Channel treats them as operators who answered the bleed | They’re unverified traffic |
| Cara / Lattice can be a shared prop | No free terminal unless a bonded friend shares |
| Celeste’s “ping” is live in the fiction | No ping for them |
| Soft perk: warmer trust, open-door framing | Soft cost: colder first NPC, delayed dossier, enter mid-scene |

Be kind to busy friends — invite them to open the node between sessions. Don’t lock the whole campaign behind Imperial Clearance.

---

## Act 3 — The radio node

This is the trespass win. Like *Portal*’s first chamber: within minutes they should feel “I broke into something.”

| Frequency | What it does |
|-----------|----------------|
| **097.9** | Locks on. Signal cleans up. Celeste’s message opens. Page asks for `#signals`. Gate arrow to the pad. |
| **033.3** | Glows and plays the blood poem (`newblood.mp3` + on-screen lines). Does **not** hard-lock the dial. Whisper may send skimmers here. |

### Hook: negative space

The blood poem ends on a question that belongs in chat — same family as *Obra Dinn* / *Her Story*: every answer should open a new why.

### How the pad code is hidden (for you)

Never print `512` as “the password” on the page. The fiction points with G512 / triad language.

| Clue in the fiction | What it means |
|---------------------|----------------|
| G512 / generation on the hull | Pad digits **5-1-2**; Whisper’s emergency dial is **033.3** |
| Three digits / Imperial Triad | Code length; sudoku blanks later |
| “Old keys wake old files” | Flight Log keyword recoveries |

### Path for people who need the Whisper guide

Careful readers can type **512** from G512 alone. Skimmers get a guided path (patron with a debt, not a walkthrough pamphlet):

1. Lock **097.9** → read Celeste → post to `#signals` → take the gate  
2. Whisper asks if they want the answer → they say **please**  
3. Whisper sends them back to the dial for the emergency frequency  
4. They find **033.3** and tell Whisper what the dial reads  
5. Whisper accepts **033.3** → sudoku → **512**

### Browser flags (intercept)

| Key | Meaning |
|-----|---------|
| `lattice.interceptTuned` | They’ve locked **097.9** at least once |
| `lattice.interceptEcho` | Old leftover; **033.3** no longer hard-locks |
| `lattice.whisperStep` / `whisperDone` | Whisper progress |

---

## Act 4 — Cara’s terminal (the deep board)

Once the pad accepts them, they’re inside Cara. STATUS is the ARG board. Flight Log and System Chart stay sealed until they earn INNER.

### What opens when

| Channel | Opens when |
|---------|------------|
| STATUS | Pad `512` / boot |
| Flight Log | INNER bay: PERSONAL RECORD |
| System Chart | INNER bay: STELLAR FIX |
| Imperial panel | Always visible; only *grants* on a correct 9-slot bind |
| Archives / Guest | Imperial Clearance granted |

### STATUS puzzle answers

| Step | What they do | What they get |
|------|--------------|---------------|
| A | FTH `/outer` → ship id `G512` → khan id `S. Raei` | Eye wakes; outer damage feed |
| B | FTH `/inner` → serials `EL0 WL3 NR5` (spaces optional) | INNER comes live |
| C | Click STELLAR FIX BAY | System Chart opens |
| D | Click PERSONAL RECORD BAY | Flight Log opens |

C and D can happen in either order. Nonsense FTH input → not recognized; type `/help`.

**Damaged stations** (shared stamp CYCLE **10** · AE **1557**):

| Order | Station | Serial | Time |
|------:|---------|--------|------|
| 1 | ENG·L | EL0 | 03:14:08 UTC |
| 2 | WINGS L | WL3 | 03:29:41 UTC |
| 3 | NDL·R | NR5 | 03:47:19 UTC |

### Hook: breadcrumb density

Each solve hands exactly one next move — pad → STATUS → outer → inner → bays → journals → nine slots. That’s the ARG crumb chain (same idea as *I Love Bees* / *Year Zero* trails), not a lore dump.

### Imperial nine-slot (optional depth)

Orbit inward → outward. Chart dossiers show `▽ NN // BIND`. Wrong full assembly flashes `SEAL HOLDS`, then clears.

| Slot | Planet | Journal | Fragment | Keywords that recover it |
|------|--------|---------|----------|---------------------------|
| 1 | Qamor | j-qamor | A1 | qamor, seed |
| 2 | Ikeph | j-ikeph | B2 | ikeph |
| 3 | Terra | j-terra | C3 | terra |
| 4 | Deshret | j-deshret | D4 | deshret, embrace |
| 5 | Teavicta | j-kaph | E5 | kaph, teavicta |
| 6 | Uros | j-uros-belt | F6 | uros, belt |
| 7 | Heixin | j-heixin | G7 | heixin |
| 8 | Haider | j-spike | H8 | haider, spike |
| 9 | Vol | j-sturm | I9 | vol, edge |

Milestone sounds on recoveries lean *Her Story* / Immortality — soft “you found something” pings, not fanfare.

### Hub save keys (for wipes)

`lattice.hull`, `lattice.unlock`, `lattice.fragments`, `lattice.clearance.draft`, `lattice.clearance`, plus milestones, journals, and the intercept/whisper keys above.

---

## Act 5 — Cold playtest

Use a friend who doesn’t know the answers. Private window or `?cold=1`.

Check that they can:

1. Open the intercept from your dead-drop pin  
2. Lock **097.9**, see the `#signals` line, take the gate  
3. Post (or at least *could* post) the dial reading  
4. Reach the pad and enter **512** (G512 / triad, or Whisper → **033.3** → sudoku)  
5. Land in the hub with STATUS open and Log/Chart looking locked  
6. Run `/outer` and `/inner`, click the INNER bays  
7. Recover fragments and either fail the seal or finish Imperial  

If the first ten minutes feel stingy, intrigue fails before STATUS ever matters. Keep early sensory reward generous (glow, signal, Celeste’s threat, blood poem) — depth comes later.

---

## Parked ideas (not canon yet)

Don’t treat these as locked until they’re in Obsidian / Flight Log.

- **Celeste** may have been a Hive Kharon/Engine mind tied to Solus’s ship; later she can drip Guest Channel / Archives crumbs. Today she is the Whisper guide.
- **Nu Lunae / Enkidu-1** can bridge a one-shot (expedition, partner, MOS ships) via Guest Channel dossiers when ready.
- **Partner’s name** lives in a Flight Log draft (`spike-partner`); move it into real entries with a `reveal` stinger when you’re ready.

---

## Where to edit

| What you’re changing | Where |
|----------------------|--------|
| STATUS / Imperial answers | `content/arg-path.js` |
| Pad, Whisper, boot, easter eggs | `content/boot-content.js` |
| Blood poem lines / timing | `content/blood-lyrics.js` |
| Flight Log stories | `lore/Player Facing/Flight Log/` → run `node scripts/build-flight-log.js` |
| Broader world orientation | [`_internal/lore-index.md`](../lore-index.md) |
