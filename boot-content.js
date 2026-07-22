/**
 * =============================================================================
 * BOOT CONTENT — EDIT THIS FILE
 * =============================================================================
 * All intro-splash copy lives here. main.js only plays it back.
 *
 * SEQUENCE:  clearance keypad  →  scrolling log  →  Empire logo  →  hub
 *
 * LINE FIELDS:
 *   text         — what appears after "> "
 *   cls          — style class (optional):
 *                    ""                  default dim
 *                    "boot-line--ok"     scarlet confirm
 *                    "boot-line--warn"   bright warning
 *                    "boot-line--err"    critical / offline
 *                    "boot-line--gold"   sovereign / consecration (sparse)
 *                    "boot-line--vow"    final vow line (stands out before Imago)
 *                    "boot-line--sec"    section divider
 *                    "boot-line--id"     identity / bond lines
 *                    "boot-line--ship"   hull / life-support telemetry
 *                    "boot-line--link"   lattice / relay / channel
 *                    "boot-line--nav"    gyro / fix / location
 *                    "boot-line--mem"    archives / permissions
 *   delay        — ms to wait AFTER this line finishes typing
 *   awaitDotsMs  — optional; blink ". .. ..." after typing for that many ms
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
   CLEARANCE EASTER EGGS — special codes (same length as ACCESS_CODE)
   --------------------------------------------------------------------------- */
export const GATE_EASTER_EGGS = {
  "420": { type: "message", text: "YOU ARE NOT FUNNY" },
  "666": { type: "eyes" },
};

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
  /** blinking "..." on lines with awaitDotsMs — ms per frame */
  dotsFrameMs: 280,
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

  /** Stepped load-in before the mark is fully visible (ms) */
  loadMs: 1800,

  /** How many stiff opacity steps during load-in */
  loadSteps: 6,

  /** How long the fully-visible logo holds before hub (ms) */
  holdMs: 2400,
};

/* ---------------------------------------------------------------------------
   BOOT LOG LINES — edit freely
   Optional: awaitDotsMs — after typing, blink "..." for that many ms (loading hold)
   --------------------------------------------------------------------------- */
export const BOOT_LINES = [
  {
    text: "[FTHFLL] LATTICE.OS :: permissions clarifying",
    cls: "boot-line--ok",
    delay: 40,
    awaitDotsMs: 2400,
  },
  { text: "==== ID_VERIFY =====================================", cls: "boot-line--sec", delay: 28 },
  { text: "  > craft.query()", cls: "boot-line--id", delay: 18 },
  { text: '  | id: "G512" // "CARA"', cls: "boot-line--id", delay: 22 },
  { text: "  | status: 0 OK", cls: "boot-line--ok boot-line--id", delay: 28 },
  { text: "  > khan.query()", cls: "boot-line--id", delay: 18 },
  { text: '  | khan: "S.RAEI" // "SOLUS"', cls: "boot-line--id", delay: 22 },

  { text: "==== HULL_TELEMETRY ================================", cls: "boot-line--sec", delay: 28 },
  { text: "  [HULL] integrity=0.45 [########----]", cls: "boot-line--ship boot-line--err", delay: 28 },
  { text: "  [HULL] flags=DAMAGED|RESTRICTED_OPERATION", cls: "boot-line--ship boot-line--err", delay: 26 },
  { text: "  [LIFE] bus=EMERGENCY_OPERATION", cls: "boot-line--ship boot-line--warn", delay: 28 },

  { text: "==== LINK_STACK ====================================", cls: "boot-line--sec", delay: 28 },
  { text: "  LATTICE.LINK >> handshake()", cls: "boot-line--link", delay: 20 },
  { text: "  LATTICE.LINK >> integrity=0.62 state=INACTIVE  errno=ELOWLINK", cls: "boot-line--link boot-line--err", delay: 30 },
  { text: "  HIVE_RELAY   >> ping(0x01)", cls: "boot-line--link", delay: 20 },
  { text: "  HIVE_RELAY   >> -1 (EHOSTUNREACH)", cls: "boot-line--link boot-line--err", delay: 30 },
  { text: "  GUEST_CH     >> status()", cls: "boot-line--link", delay: 18 },
  { text: "  GUEST_CH     >> state=REPAIRING  pending=true", cls: "boot-line--link", delay: 22 },

  { text: "==== NAV_CORE ======================================", cls: "boot-line--sec", delay: 28 },
  { text: "  GYRO_ARRAY.diag()", cls: "boot-line--nav", delay: 18 },
  { text: '  GYRO_ARRAY.state = "LIMITED_FUNCTIONALITY"  // WARN', cls: "boot-line--nav boot-line--warn", delay: 26 },
  { text: "  GYRO_ARRAY.nav.resolve()", cls: "boot-line--nav", delay: 18 },
  { text: '  GYRO_ARRAY.fix = { body: "UROS.STURM", conf: "PARTIAL" }', cls: "boot-line--nav boot-line--warn", delay: 30 },

  { text: "==== MEMORY / ACCESS ===============================", cls: "boot-line--sec", delay: 28 },
  { text: "  ARCHIVES.partition_scan()", cls: "boot-line--mem", delay: 18 },
  { text: "  ARCHIVES.result = RECOVERABLE", cls: "boot-line--mem boot-line--ok", delay: 24 },
  { text: "  ACCESS.request(LIMITED | EMERG_PERMS)", cls: "boot-line--mem", delay: 18 },
  { text: "  ACCESS.grant = true", cls: "boot-line--mem boot-line--ok", delay: 40 },
  { text: "==== SYS_PROBE COMPLETE ============================", cls: "boot-line--sec", delay: 50 },

  { text: "==== RECONSTRUCTION ==========================", cls: "boot-line--sec", delay: 50 },
  { text: "  CARAPACE.reconstruct()", cls: "boot-line--ok", delay: 18 },
  { text: "  CARAPACE.result = IN_PROGRESS", cls: "boot-line--ok", delay: 24 },
  { text: "  CARAPACE.status = IN_PROGRESS", cls: "boot-line--ok", delay: 24 },

  { text: "==== INT_LOAD COMPLETE ============================", cls: "boot-line--sec", delay: 50 },
  { text: "GIVE YOUR LIFE TO HER", cls: "boot-line--vow", delay: 2800 },
];
