# Celeste intercept — canonical copy

> Author/dev reference. Public face: [`intercept.html`](../../intercept.html) at site root.
> Encode **512** via G512 / triad language — never type the digits as “the password.”
> **Sigil:** □ (square) = Celeste. ▽ remains Imperial Triad elsewhere.
>
> **Entry UX:** page opens as a radio tuner (000.0–108.0). Hold ◀/▶ to sweep;
> carriers lock after ~2s dwell:
> - **097.9** — greeting: TriadSignal crushed → clean → aperture → this copy → **OPEN CLEARANCE GATE**
> - **051.2** — second bleed (Whisper path): compact AUX ECHO fragment only (no full open)
>
> Pad link is **←** (back to tuner). After a successful 097.9 lock, `lattice.interceptTuned` shows **→** under the dial on return visits. Echo lock also keeps **→** visible.

---

## Intercept body (ships on the page)

```
ID KHARON-CELESTE || PRESAGE PROJECTION INTERCEPT
ONE WAY SIGNAL · DO NOT REPLY ON THIS FREQUENCY

I am not your friend.
I am the guide that answers when bonded craft forget how to ask.

G512 Carapace — she calls herself Cara — is still humming on a dead relay.
Sturm weather. Partition rot. The Khan left a mess and a gate.

You will complete clearance.
Three digits. Same count as the Imperial Triad.
Same generation stamped on her hull — the mark that ages Scourge iron.

Open the node.
Finish the handshake.
After that: old keys wake old files. Search what Lattice still remembers.

Pass this intercept. Not your session.

— Celeste
```

### Encoding notes (for you, not the page)

| Clue in copy | Points to |
|--------------|-----------|
| G512 / generation on hull | **5-1-2** (pad) and dial mark **051.2** (second carrier) |
| Three digits / Imperial Triad | three-length code; Whisper sudoku blanks later |
| “old keys wake old files” | Flight Log keyword recover |

Whisper remains backup if they skim.

---

## Clearance path (Whisper-extended)

Cold / careful readers can still enter **512** on the pad from G512 alone.

Skimmer path through Kharon-Celeste:

1. Tune **097.9** → intercept → **OPEN CLEARANCE GATE**
2. Whisper: want the answer? → magic word (**please**) → terminal expands
3. Whisper sends them back to the dial: hull **generation as a frequency**
4. Tune **051.2** → AUX ECHO fragment (“tell the guide what the dial reads”) → **→** to pad
5. Whisper accepts **051.2** (not bare 512) → sudoku blanks → **512**

### localStorage keys

| Key | Meaning |
|-----|---------|
| `lattice.interceptTuned` | Locked greeting **097.9** at least once |
| `lattice.interceptEcho` | Locked second carrier **051.2** |
| `lattice.whisperStep` | Whisper dialogue step index |
| `lattice.whisperDone` | Sudoku beat finished |

---

## Share rule

Friends forward the **intercept URL** (or this text + node link). They do not share browser `localStorage` / Imperial Clearance.
