/**
 * =============================================================================
 * BOOT CONTENT — EDIT THIS FILE
 * =============================================================================
 * Intro splash COPY lives here. main.js only plays it back.
 *
 * ALSO EDIT HERE:
 *   FLIGHT LOG STORIES  — search "FLIGHT LOG STORIES" below
 *                         journal names, entry titles, and body prose
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
  /** Unlabeled anomaly on Teavicta's orbit */
  mystery: {
    id: "teavicta-mystery",
    parent: "teavicta",
    offset: 18,
    angle: -72,
    mark: "?",
    readout: "A mystery in the orbit of Unconquered Storm...",
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
   FLIGHT LOG STORIES — EDIT HERE (Solus personal journals)
   =============================================================================
   Come back to this block to write / rename journals and entries.

   JOURNAL fields:
     id            — stable key (don’t rename casually)
     title         — journal name in the left list
                     set corruptTitle: true to show gibberish instead
     yearStart/End — span under the journal name (hidden if corruptTitle)

   ENTRY fields:
     id            — stable key
     title         — entry name (null → illegible gibberish in UI)
     year, cycle   — dating (shown as “AE · CYCLE”; illegible unless recovered)
     body          — story text shown on the right
                     null / "" → shared corruption blob (not yet written)
     recovered     — true = title, date, and body all readable

   Tip: leave body: null on stubs; replace with your prose when ready.
   Impact under Sturm is the current recovered beat.
   Minimum AE year: 1510.
   ============================================================================= */

const FLIGHT_LOG_JOURNALS = [
  /* --- filler / corrupted journals (names intentionally blank) ------------- */
  {
    id: "j-qamor",
    title: null,
    corruptTitle: true,
    yearStart: 1510,
    yearEnd: 1513,
    entries: [
      {
        id: "qamor-hey-cara",
        title: "Hey Cara 512!",
        year: 1512,
        cycle: 84,
        recovered: true,
        /* ↓ write the entry body between the backticks ↓ */
        body: `Hey Cara! I'm writing in here because I'm bored as all hell on the Hive and I figured out how overide with Sol's ID, so HAHA!

        Should I be using my Shaper status to break into a Khan's ship? Pr0lly n0t.
        Could I be exed for unauthorized access if Kairet found out? Definitely.

        But who cares!? Ma said you only live once, and its not like you would or could rat me out to Sol anyway. Plus, I kinda like the idea that Sol will be looking through her old logs and then find this. She would definitely be pissed. But then probably give a long sigh. Maybe I could even get her to crack a smile.

        Oh damn, speak of the devil. I better hide before she finds me out. Seeya!
`,
      },
      { id: "qamor-01", title: null, year: 1510, cycle: 2, body: null },
      { id: "qamor-02", title: null, year: 1511, cycle: 7, body: null },
      { id: "qamor-03", title: null, year: 1512, cycle: 11, body: null },
      { id: "qamor-04", title: null, year: 1513, cycle: 4, body: null },
    ],
  },
  {
    id: "j-ikeph",
    title: null,
    corruptTitle: true,
    yearStart: 1515,
    yearEnd: 1518,
    entries: [
      { id: "ikeph-01", title: null, year: 1515, cycle: 1, body: null },
      { id: "ikeph-02", title: null, year: 1516, cycle: 5, body: null },
      { id: "ikeph-03", title: null, year: 1517, cycle: 9, body: null },
    ],
  },
  {
    id: "j-terra",
    title: null,
    corruptTitle: true,
    yearStart: 1520,
    yearEnd: 1522,
    entries: [
      { id: "terra-01", title: null, year: 1520, cycle: 3, body: null },
      { id: "terra-02", title: null, year: 1521, cycle: 8, body: null },
      { id: "terra-03", title: null, year: 1522, cycle: 6, body: null },
    ],
  },

  /* --- named journals (readable titles) ------------------------------------ */
  {
    id: "j-kaph",
    title: "Kaph — Prison Moon",
    yearStart: 1523,
    yearEnd: 1526,
    entries: [
      /* Write Kaph stories here */
      { id: "kaph-01", title: null, year: 1523, cycle: 2, body: null },
      { id: "kaph-02", title: null, year: 1524, cycle: 5, body: null },
      { id: "kaph-03", title: null, year: 1525, cycle: 9, body: null },
      { id: "kaph-04", title: null, year: 1526, cycle: 1, body: null },
      { id: "kaph-05", title: null, year: 1526, cycle: 8, body: null },
    ],
  },
  {
    id: "j-deshret",
    title: "Deshret — The Embrace",
    yearStart: 1530,
    yearEnd: 1533,
    entries: [
      /* Write Deshret stories here */
      { id: "desh-01", title: null, year: 1530, cycle: 3, body: null },
      { id: "desh-02", title: null, year: 1531, cycle: 6, body: null },
      { id: "desh-03", title: null, year: 1532, cycle: 2, body: null },
      { id: "desh-04", title: null, year: 1532, cycle: 10, body: null },
      { id: "desh-05", title: null, year: 1533, cycle: 4, body: null },
      { id: "desh-06", title: null, year: 1533, cycle: 11, body: null },
    ],
  },
  {
    id: "j-heixin",
    title: null,
    corruptTitle: true,
    yearStart: 1535,
    yearEnd: 1538,
    entries: [
      { id: "heixin-01", title: null, year: 1535, cycle: 4, body: null },
      { id: "heixin-02", title: null, year: 1537, cycle: 7, body: null },
      { id: "heixin-03", title: null, year: 1538, cycle: 12, body: null },
    ],
  },
  {
    id: "j-uros-belt",
    title: "Uros Belt — Sweep Pattern",
    yearStart: 1546,
    yearEnd: 1550,
    entries: [
      /* Write Uros Belt stories here */
      { id: "belt-01", title: null, year: 1546, cycle: 5, body: null },
      { id: "belt-02", title: null, year: 1547, cycle: 9, body: null },
      { id: "belt-03", title: null, year: 1549, cycle: 2, body: null },
      { id: "belt-04", title: null, year: 1550, cycle: 7, body: null },
    ],
  },

  /* --- most recent journal (keep last) ------------------------------------- */
  {
    id: "j-sturm",
    title: "Sturm — Moon of Uros",
    yearStart: 1555,
    yearEnd: 1557,
    entries: [
      /* Write Sturm stories here */
      { id: "sturm-01", title: null, year: 1555, cycle: 3, body: null },
      { id: "sturm-02", title: null, year: 1556, cycle: 6, body: null },
      { id: "sturm-03", title: null, year: 1556, cycle: 10, body: null },

      /* RECOVERED — current readable beat */
      {
        id: "sturm-impact",
        title: "Impact",
        year: 1557,
        cycle: 11,
        recovered: true,
        body: "I've crashed. Fuck.",
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
   FLIGHT LOG — runtime build (usually leave alone)
   Turns FLIGHT_LOG_JOURNALS into UI data; fills null titles/bodies with
   corruption. Shared blob is used for every unrecovered entry body.
   --------------------------------------------------------------------------- */
const FLIGHT_CORRUPT_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz0123456789/·#";

function flightRand(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function makeCorruptToken(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += FLIGHT_CORRUPT_CHARS[flightRand(0, FLIGHT_CORRUPT_CHARS.length - 1)];
  }
  return out;
}

function makeCorruptionBlob(len = 360) {
  let out = "";
  for (let i = 0; i < len; i++) {
    if (i > 0 && i % 47 === 0) out += "\n";
    else if (i > 0 && i % 11 === 0) out += " ";
    else out += FLIGHT_CORRUPT_CHARS[flightRand(0, FLIGHT_CORRUPT_CHARS.length - 1)];
  }
  return out;
}

function buildFlightLog() {
  const corruption = makeCorruptionBlob(flightRand(1400, 2200));

  const journals = FLIGHT_LOG_JOURNALS.map((journal) => {
    const titleCorrupted = Boolean(journal.corruptTitle || !journal.title);
    const title = titleCorrupted
      ? makeCorruptToken(flightRand(10, 18))
      : journal.title;

    const entries = (journal.entries ?? []).map((entry) => {
      const recovered = Boolean(entry.recovered);
      const hasBody = typeof entry.body === "string" && entry.body.length > 0;

      if (recovered) {
        return {
          id: entry.id,
          title: entry.title ?? "Untitled",
          year: entry.year,
          cycle: entry.cycle,
          yearDisplay: String(entry.year),
          cycleDisplay: String(entry.cycle).padStart(2, "0"),
          dateCorrupted: false,
          corrupted: false,
          body: entry.body ?? "",
        };
      }

      return {
        id: entry.id,
        title: entry.title || makeCorruptToken(flightRand(7, 14)),
        year: entry.year,
        cycle: entry.cycle,
        yearDisplay: makeCorruptToken(flightRand(3, 5)),
        cycleDisplay: makeCorruptToken(2),
        dateCorrupted: true,
        corrupted: !hasBody,
        body: hasBody ? entry.body : null,
      };
    });

    return {
      id: journal.id,
      title,
      titleCorrupted,
      yearStart: journal.yearStart,
      yearEnd: journal.yearEnd,
      spanDisplay: titleCorrupted
        ? `${makeCorruptToken(3)}–${makeCorruptToken(3)} AE`
        : undefined,
      entries,
    };
  });

  return {
    idle: "SELECT JOURNAL ENTRY",
    corruption,
    journals,
  };
}

export const FLIGHT_LOG = buildFlightLog();

