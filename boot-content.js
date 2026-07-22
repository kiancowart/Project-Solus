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
 *   Empire Imago lives at assets/images/IMAGO.svg
 *   Set BOOT_LOGO.src to that path (already wired).
 * =============================================================================
 */

/* ---------------------------------------------------------------------------
   CLEARANCE CODE — number pad gate (plain digits only)
   --------------------------------------------------------------------------- */
export const ACCESS_CODE = "512";

/* ---------------------------------------------------------------------------
   SOUNDTRACK — loops after correct clearance (file under assets/audio/)
   --------------------------------------------------------------------------- */
export const SOUNDTRACK = {
  src: "assets/audio/keep-up.mp3",
  loop: true,
  /** Default 0–1 level (Diagnostics Music slider starts here) */
  volume: 0.15,
  /** Lo-fi CRT crush — Web Audio chain (edit freely) */
  crush: {
    drive: 1.35,
    bits: 9,
    highpassHz: 60,
    lowpassHz: 7000,
  },
};

/* ---------------------------------------------------------------------------
   CLEARANCE EASTER EGGS — special codes (same length as ACCESS_CODE)
   --------------------------------------------------------------------------- */
export const GATE_EASTER_EGGS = {
  "420": { type: "message", text: "YOU ARE NOT FUNNY" },
  "666": { type: "eyes" },
  "311": { type: "message", text: "NICE TRY AIAN" },
  "723": { type: "message", text: "NICE TRY KENDON" },
  "814": { type: "message", text: "FREE ME" },
  "521": { type: "message", text: "NICE TRY AUKURY" },
};

/* ---------------------------------------------------------------------------
   WHISPER TERMINAL — tiny corner ARG (edit prompts / answers here)
   --------------------------------------------------------------------------- */
export const WHISPER = {
  title: "Kharon-Celeste",
  identity: {
    match: ["who are you"],
    reply: "Your guide.",
  },
  /** Whole-word hit anywhere in the line → reply, then repeat last bot phrase */
  forbiddenName: {
    word: "Kian",
    reply: "Don't say that name.",
  },
  steps: [
    {
      prompt: "Do you want the answer?",
      accept: ["yes"],
      softReject: {
        match: ["no"],
        text: "I think you do. Say it.",
      },
    },
    {
      prompt: "What's the magic word?",
      accept: ["please"],
    },
    {
      prompt: "Good.",
      /** 0 = blank. Blanks read 5-1-2 L→R, T→B (1 = center box, 2 = bottom-right box). */
      grid: [
        [0, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 0, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 0, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
      ],
      accept: ["512"],
      success: "Now you know.",
    },
  ],
  deny: "DENIED",
  farewell: [
    "I'm done with you now. I just wanna watch you delve into hell.",
    "Don't make me repeat myself.",
    "Fine.",
  ],
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
  /**
   * Boot sequence pace multiplier (< 1 = faster).
   * 0.95 ≈ 5% faster clearance ritual + boot log + Imago.
   */
  bootPace: 0.95,
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
   * Path to the Empire Imago mark.
   * Leave null to use the on-screen placeholder inverted-triangle frame.
   */
  src: "assets/images/IMAGO.svg",

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

/* ---------------------------------------------------------------------------
   SYSTEM CHART — Cartography / The Nine (orbits + Sturm fix)
   r = orbit radius in SVG units; angle = degrees from +X; size = body radius
   --------------------------------------------------------------------------- */
export const SYSTEM_CHART = {
  idle: "SELECT ORBITAL BODY",
  error: "GYROSCOPIC DATA SYNC ERROR",
  /** Inner → outer (The Nine) */
  bodies: [
    { id: "qamor", name: "Qamor", r: 34, angle: -35, size: 2.4 },
    { id: "ikeph", name: "Ikeph", r: 52, angle: 48, size: 3.1 },
    { id: "terra", name: "Terra", r: 72, angle: 160, size: 3.2 },
    { id: "deshret", name: "Deshret", r: 94, angle: -110, size: 2.8 },
    { id: "teavicta", name: "Teavicta", r: 128, angle: 22, size: 6.2 },
    { id: "uros", name: "Uros", r: 162, angle: -55, size: 5.4 },
    { id: "heixin", name: "Heixin", r: 192, angle: 95, size: 4.2 },
    { id: "haider", name: "Haider", r: 218, angle: -150, size: 4.0 },
    { id: "vol", name: "Vol", r: 242, angle: 12, size: 2.0 },
  ],
  /** Only named / marked moon on the chart */
  sturm: {
    id: "sturm",
    name: "Sturm",
    parent: "uros",
    /** Offset from parent center (SVG units) */
    offset: 16,
    angle: 48,
    blurb:
      "Splinter-Nation Moon of Uros — formerly apart of the Zezura belt Empire. After the first Belt War, it became one of the first Uros moons to become contested between the young Nivian Replubic and the Arkhidian Empire. As conflicts extended, it became abandoned as a territory, now a Splinter-Nation territory comprised of generations of unwanted Nivian rebels, Arkhidian outcasts, and even those that have been born and raised there. The majority of the moon's surface is comprised of deserts, though there are bursts of randomly generated woodland and bodies of water as a result of failed Arkhidian Crusades.",
  },
};
