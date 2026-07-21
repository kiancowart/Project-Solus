/**
 * =============================================================================
 * BOOT CONTENT — EDIT THIS FILE
 * =============================================================================
 * All intro-splash copy lives here. main.js only plays it back.
 *
 * SEQUENCE:  clearance keypad  →  scrolling log  →  Empire logo  →  hub
 *
 * LINE FIELDS:
 *   text  — what appears after "> "
 *   cls   — style class (optional):
 *             ""                 default dim
 *             "boot-line--ok"    scarlet confirm
 *             "boot-line--warn"  bright warning
 *             "boot-line--err"   critical / offline
 *             "boot-line--gold"  sovereign / consecration (sparse)
 *   delay — ms to wait AFTER this line finishes typing
 *
 * MOTION:
 *   Stiff / Alien-terminal style — typed characters, stepped reveals.
 *
 * LOGO:
 *   Drop your Empire mark at assets/empire-imago.svg (or .png)
 *   then set BOOT_LOGO.src to that path. Until then, the placeholder shows.
 * =============================================================================
 */

/* ---------------------------------------------------------------------------
   CLEARANCE CODE — number pad gate (plain digits only)
   --------------------------------------------------------------------------- */
export const ACCESS_CODE = "512";

/* ---------------------------------------------------------------------------
   SUCCESS RITUAL — plays after correct clearance (edit for drama)
   --------------------------------------------------------------------------- */
export const ACCESS_SUCCESS = {
  /** Typed lines after ACCEPTED — top to bottom, stiff teletype */
  lines: [
    { text: "CLEARANCE VERIFIED", delay: 120 },
    { text: "TRIAD AUTHORITY · ACKNOWLEDGED", delay: 140 },
    { text: "LATTICE CHANNEL · UNSEALING", delay: 180 },
  ],
  /** Hold on final beat before boot log starts (ms) */
  holdMs: 700,
};

/* ---------------------------------------------------------------------------
   TYPE / REVEAL TUNING — oldschool stiff terminal
   --------------------------------------------------------------------------- */
export const MOTION = {
  /** ms per character while typing boot lines */
  typeMs: 8,
  /** occasional hitch every N chars (Alien teletype stutter) */
  hitchEvery: 12,
  hitchMs: 20,
  /** ms between panel blocks revealing top → bottom */
  blockStepMs: 45,
};

/* ---------------------------------------------------------------------------
   EMPIRE LOGO (Imago) — appears AFTER the scrolling text, before hub
   --------------------------------------------------------------------------- */
export const BOOT_LOGO = {
  enabled: true,

  /**
   * Path to your finished mark, e.g. "assets/empire-imago.svg"
   * Leave null to use the on-screen placeholder triangle frame.
   */
  src: null,

  alt: "Arkhidian Empire — Imago",

  /** How long the logo holds before entering the hub (ms) — hard cut, no fade */
  holdMs: 700,
};

/* ---------------------------------------------------------------------------
   BOOT LOG LINES — edit freely
   --------------------------------------------------------------------------- */
export const BOOT_LINES = [
  { text: "LATTICE OS — FTHFLL resuscitating…", cls: "boot-line--ok", delay: 40 },
  { text: "Scarlet Order of the Veil · consecrated craftware", cls: "boot-line--gold", delay: 40 },
  { text: "Craft ID … G512 Carapace-class · CARA", cls: "boot-line--ok", delay: 35 },
  { text: "Khan-link handshake … SOLUS · BOUND", cls: "boot-line--ok", delay: 40 },
  { text: "WARNING: hull integrity critical", cls: "boot-line--err", delay: 35 },
  { text: "Propulsion lattice … OFFLINE", cls: "boot-line--err", delay: 30 },
  { text: "Life support … partial / recycling", cls: "boot-line--warn", delay: 35 },
  { text: "Imperial relay … NO SIGNAL", cls: "boot-line--err", delay: 35 },
  { text: "Nav fix … Uros · Sturm", cls: "boot-line--warn", delay: 30 },
  { text: "Flight log partition … recoverable", cls: "boot-line--ok", delay: 30 },
  { text: "Guest channel … sealed", cls: "", delay: 25 },
  { text: "Operator session opened aboard Cara.", cls: "boot-line--ok", delay: 60 },
];
