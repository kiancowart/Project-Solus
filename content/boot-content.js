/**
 * =============================================================================
 * BOOT CONTENT — EDIT THIS FILE
 * =============================================================================
 * Intro splash COPY lives here. main.js only plays it back.
 *
 * ALSO:
 *   Flight Log stories → lore/Player Facing/Flight Log/ (Obsidian)
 *   Rebuild: node scripts/build-flight-log.js
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

import { buildFlatFlightLog } from "./flight-log-entries.js";

/* ---------------------------------------------------------------------------
   CLEARANCE CODE — number pad gate (plain digits only)
   --------------------------------------------------------------------------- */
export const ACCESS_CODE = "512";

/* ---------------------------------------------------------------------------
   IMPERIAL CLEARANCE — ARG finale unlock (persisted in localStorage)
   Pad code reaches the hub + STATUS. STATUS puzzles unlock Flight Log &
   System Chart. Imperial 9-slot assembly opens Archives / Guest Channel.
   --------------------------------------------------------------------------- */
export const CLEARANCE = {
  storageKey: "lattice.clearance",
  /** Current flag written on finale */
  imperialValue: "imperial",
  /** Legacy Whisper-era value still honored as Imperial Clearance */
  deepValue: "deep",
  milestoneKey: "lattice.milestones",
  /** Sealed until Imperial Clearance */
  lockedUntilImperial: ["archives", "guest-campaign-1", "guest-corrupt"],
  /** Sealed until STATUS puzzles set lattice.unlock.* */
  lockedUntilProgress: ["flightlog", "cartography"],
  seal: {
    title: "PARTITION LOCKED",
    body: "Imperial Clearance required. Complete the nine-slot seal — or return to STATUS.",
  },
  progressSeal: {
    title: "PARTITION LOCKED",
    body: "Channel offline. Restore INNER diagnostics on STATUS — Terminal still listens.",
  },
};

/* ---------------------------------------------------------------------------
   AMBIENCE — terminal hum from site open (except 666 eyes)
   --------------------------------------------------------------------------- */
export const AMBIENCE = {
  src: "assets/audio/music/terminal-ambience.mp3",
  loop: true,
  /** Default 0–1 level (Diagnostics Ambience slider starts here) */
  volume: 0.18,
};

/* ---------------------------------------------------------------------------
   MUSIC — hub beds after pad / Imperial (files under assets/audio/music/)
   Recursion: pad → until Imperial bind. Ascendancy: default after Imperial.
   --------------------------------------------------------------------------- */
export const MUSIC = {
  /** Default 0–1 level (Diagnostics Music slider starts at 40%) */
  volume: 0.4,
  /** Lo-fi CRT crush — Web Audio chain (edit freely) */
  crush: {
    drive: 1.35,
    bits: 9,
    highpassHz: 60,
    lowpassHz: 7000,
  },
  /** After correct pad code (pre-Imperial) */
  hubDefault: "recursion",
  /** After Imperial Clearance bind completes */
  postImperialDefault: "ascendancy",
  tracks: [
    {
      id: "recursion",
      title: "Recursion",
      src: "assets/audio/music/Recursion.wav",
      loop: true,
    },
    {
      id: "ascendancy",
      title: "Ascendancy",
      src: "assets/audio/music/Ascendancy.wav",
      loop: true,
    },
  ],
};

/** @deprecated use MUSIC — kept so older imports don't break */
export const SOUNDTRACK = {
  src: MUSIC.tracks.find((t) => t.id === MUSIC.postImperialDefault)?.src,
  loop: true,
  volume: MUSIC.volume,
  crush: MUSIC.crush,
};

/* ---------------------------------------------------------------------------
   CLEARANCE EASTER EGGS — special codes (same length as ACCESS_CODE)
   --------------------------------------------------------------------------- */
export const GATE_EASTER_EGGS = {
  /** Dev/test: hub access + full Imperial Clearance + STATUS unlocks */
  "111": { type: "devFullAccess" },
  /** Wipe all ARG progress and reload to the number pad */
  "222": { type: "coldReset" },
  "420": { type: "message", text: "YOU ARE NOT FUNNY" },
  "666": { type: "eyes" },
};

/**
 * Codes that flash the shared line below — just append new 3-digit strings.
 * (512 = access · 111 = dev full · 222 = cold reset · 420 / 666 = special eggs above · else here.)
 */
export const GATE_NICE_TRY_CODES = ["311", "723", "814", "521"];
export const GATE_NICE_TRY_TEXT = "NICE TRY";

/* ---------------------------------------------------------------------------
   WHISPER TERMINAL — tiny corner ARG (edit prompts / answers here)
   --------------------------------------------------------------------------- */
export const WHISPER = {
  title: "KHARON-CELESTE",
  /** Shown once when the tab is opened after 3+ denied pad attempts */
  struggleLine: "I see you're struggling.",
  /** Persist guide progress across tuner trips (← / →) */
  progressKey: "lattice.whisperStep",
  doneKey: "lattice.whisperDone",
  /** Sudoku fill plays once; return visits show the finished board */
  sudokuSeenKey: "lattice.whisperSudokuSeen",
  identity: {
    match: ["who are you"],
    reply: "TURN AROUND",
  },
  /** Whole-word hit anywhere in the line → reply, then repeat last bot phrase */
  forbiddenName: {
    word: "Kian",
    reply: "Don't say that name.",
  },
  /**
   * Loose phrase match: needle may appear among other words.
   * Longer phrases checked first so "i do not" wins over "i do".
   */
  affirmatives: [
    "yes",
    "yep",
    "yup",
    "yeah",
    "yea",
    "yah",
    "yas",
    "ya",
    "sure",
    "ok",
    "okay",
    "alright",
    "all right",
    "affirmative",
    "absolutely",
    "definitely",
    "certainly",
    "of course",
    "please",
    "plz",
    "i do",
    "i want",
    "i want it",
    "i want the answer",
    "give it",
    "give me",
    "tell me",
    "si",
    "oui",
    "ja",
    "da",
    "hai",
    "sim",
    "tak",
    "ken",
    "aye",
  ],
  negatives: [
    "no",
    "nope",
    "nah",
    "nay",
    "nae",
    "negative",
    "never",
    "i dont",
    "i do not",
    "i dont want",
    "i do not want",
    "dont",
    "do not",
    "nein",
    "non",
    "nyet",
    "iie",
    "ie",
    "nee",
    "nao",
    "nej",
    "nie",
  ],
  steps: [
    {
      prompt: "Do you want the answer?",
      /** Loose yes/no detection (see affirmatives / negatives above) */
      acceptMode: "affirmative",
      softReject: {
        matchMode: "negative",
        text: "I think you do. Say yes.",
      },
    },
    {
      prompt: "What's the magic word?",
      accept: ["please", "plz"],
      acceptMode: "contains",
      /** Grow the terminal after this beat for later puzzles */
      expandAfter: true,
      /** If please/plz already appeared in the prior affirmative, skip this beat */
      skipIfPleaseSaid: true,
    },
    {
      /**
       * Sends them back to intercept.html → 033.3 (emergency frequency).
       * Accept the one-word answer key from the blood carrier poem.
       */
      prompt:
        "The emergency frequency is on the tuner. Enter the answer key here.",
      accept: ["blood"],
      acceptMode: "exact",
      softRejects: [
        {
          match: ["033.3", "33.3", "0333", "333"],
          matchMode: "exact",
          text: "Ok. That's the frequency. But I need the key.",
          cls: "whisper__line--prompt",
        },
      ],
      success: "Key accepted.",
    },
    {
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
    },
    {
      prompt: "THE EMPRESS GIVES HER ______",
      accept: ["reward"],
      acceptMode: "exact",
      softReject: {
        match: ["blood", "empress"],
        matchMode: "contains",
        text: "Finish the line.",
      },
    },
    {
      prompt: "Do you really think she rewards her people?",
      acceptMode: "negative",
      success: "Correct.",
      softReject: {
        matchMode: "affirmative",
        laughLock: true,
      },
    },
  ],
  deny: "DENIED",
  unlockLine: "There's still so much more to know.",
  farewell: [
    "I'm done helping.",
    "Don't make me repeat myself.",
    "Fine.",
  ],
  /**
   * If they paste the pad code before the sudoku beat, dismiss the guide.
   * Next inputs use `farewell` (starting with "I'm done helping.").
   */
  earlyCode: {
    match: ["512", "g512"],
    text: "So you already know. Stop wasting my time.",
  },
};

/* ---------------------------------------------------------------------------
   GUEST CHANNEL — sub-channels under External dropdown
   --------------------------------------------------------------------------- */
export const GUEST_SUBCHANNELS = {
  corruptLabel: "▓█░4F2·92A",
};

/* ---------------------------------------------------------------------------
   GUEST CHANNEL — campaign roster (edit as tables run)
   status: "SEALED" | "ACTIVE" | "ARCHIVED"
   Optional archiveIds: lore-catalog entry ids to hint in the briefing
   --------------------------------------------------------------------------- */
export const GUEST_CAMPAIGNS = {
  emptyTitle: "GUEST CHANNEL",
  emptyBody: "AUX link idle — no active roster. Campaign dossiers will appear here.",
  campaigns: [
    /* Example when you publish a table:
    {
      id: "camp-01",
      title: "Simulacrum — First Descent",
      status: "ACTIVE",
      cycle: "1557 · C.12",
      briefing:
        "Guest operators cordoned under AUX. Flight record of Solus remains sealed from this channel.",
      archiveIds: [],
    },
    */
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
    text: "REMOTE_LINK :: bridging terminal → G512 interface via KHARON-CELESTE",
    cls: "boot-line--link",
    delay: 40,
    awaitDotsMs: 2400,
  },
  {
    text: "REMOTE_LINK :: connection confirmed",
    cls: "boot-line--ok boot-line--link",
    delay: 50,
  },
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
      "Splinter-Nation Moon of Uros — formerly a part of the Zezura belt Empire. After the first Belt War, it became one of the first Uros moons contested between the young Nivian Republic and the Arkhidian Empire. As conflicts extended, it was abandoned as a territory — now a Splinter-Nation of unwanted Nivian rebels, Arkhidian outcasts, and those born under crusade weather. Most of the surface is desert, with bursts of woodland and water from failed Arkhidian Crusades. Lattice local fix after impact: VX-48. Prison-moon shadows on Deshret still count five ticks from dawn when the brand aligns.",
  },
  /** Nu Lunae / Enkidu-1 — non-Imperial easter egg framework */
  mystery: {
    id: "teavicta-mystery",
    parent: "teavicta",
    offset: 18,
    angle: -72,
    mark: "?",
    readout:
      "NU LUNAE // ENKIDU-1 — AUX bleed on Teavicta's shoulder. Not an Imperial well. Guest Channel may answer later. Do not bind this mark.",
  },
  /** Shared archive bay under the chart — filled by planetary extracts later */
  archive: {
    title: "SYSTEM ARCHIVE",
    code: "CART.ARCHIVE // STATUS=NONFUNCTIONAL",
    body:
      "Archive mesh is still repairing after impact. Planetary extracts and cross-indexed memory are inaccessible.",
  },
};

/* =============================================================================
   FLIGHT LOG — flat chronological entries (content/flight-log-entries.js)
   ============================================================================= */

export const FLIGHT_LOG = buildFlatFlightLog();
