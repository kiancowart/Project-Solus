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
    { text: "ACCESS TO LATTICE.OS GRANTED", delay: 140 },
    { text: "GLORY TO HER AND HER EMPIRE", delay: 180 },
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
  { text: "LATTICE.OS — FTHFLL permissions clarifying...", cls: "boot-line--ok", delay: 40 },
  { text: "CARAPACE ID > G512 // CARA", cls: "boot-line--ok", delay: 35 },
  { text: "KHAN ID > S. Raei // SOLUS", cls: "boot-line--ok", delay: 40 },
  { text: "LATTICE.OS CONNECTION > 62% // LOW INTEGRITY | inactive", cls: "boot-line--err", delay: 35 },
  { text: "HULL STRUCTURE > 45% // DAMAGED // RESTRICTED OPERATION", cls: "boot-line--err", delay: 30 },
  { text: "LIFE SUPPORT OPERATION > EMERGENCY OPERATION", cls: "boot-line--warn", delay: 35 },
  { text: "HIVE RELAY CONTACT... Failed", cls: "boot-line--err", delay: 35 },
  { text: "GYROSCOPE ARRAY > LIMITED FUNCTIONALITY", cls: "boot-line--warn", delay: 30 },
  { text: "GRYOSCOPE ARRAY | nav ID > UROS · STURM", cls: "boot-line--warn", delay: 35 },
  { text: "ARCHIVES... recoverable", cls: "boot-line--ok", delay: 30 },
  { text: "Guest channel … REPAIRING", cls: "", delay: 25 },
  { text: "LIMITED ARCHIVE ACCESS | EMERGENCY PERMISSIONS GRANTED", cls: "boot-line--ok", delay: 60 },
];
