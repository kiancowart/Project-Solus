# Discord packaging — Celeste intercept

## How the links work (no jargon)

Your Project Solus folder has two starting pages next to each other:

| File | What it is |
|------|------------|
| `intercept.html` | Celeste’s message (post **this** URL in Discord) |
| `index.html` | The number pad / Cara terminal |

**Yes:** if someone opens `…/intercept.html`, they see the intercept first. They tap **OPEN CLEARANCE GATE** → `index.html` (number pad).

**“Serving”** just means putting that folder on the internet (GitHub Pages, Netlify, itch, your own host, etc.) so Discord gets a real `https://…` link. On your machine you can open the files locally to test; friends need a hosted URL.

Pin / post **only** the intercept URL, e.g. `https://YOUR-HOST/intercept.html`

Do **not** spoil the clearance digits in Discord. Spoiler tags are fine only for the intercept link if you want soft hide.

From the number pad, operators can use **←** to return to Celeste’s frequency dial.
If they have already locked **097.9** once, the tuner shows **→** under the dial to jump back to the pad.
Whisper may send skimmers back for a **second carrier (051.2)** before the sudoku — do not spoil that frequency in Discord.

---

## Friends (DMs / general friends server)

```
Intercept recovered from an AUX bleed.

Forward intact. Do not reply on this frequency.

Start here:
[INTERCEPT URL]
```

---

## Lux Mori campaign server

```
AUX BLEED // GUEST CHANNEL STATIC

An intercept surfaced on a frequency that isn't Lux Mori's table —
but Guest Channel is sealing other campaigns, and the static may brush this server.

Forward intact. Do not reply on this frequency.
Operators: open the node, finish the handshake, then search what Lattice still remembers.

Start here:
[INTERCEPT URL]

📌 Pin this in #signals / #intercepts for late joiners.
```

---

## Pin checklist

- [ ] One link only (`intercept.html` — it leads to the clearance gate)
- [ ] No `512` / “try G512 as code” / second-carrier **051.2** spoilers in chat
- [ ] Late joiners can find the pin without digging scroll history
- [ ] Optional later: short Celeste audio ping as a second message (never the only carrier of the URL)
