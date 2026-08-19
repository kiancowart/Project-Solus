/**
 * =============================================================================
 * arg-path.js — EDIT PUZZLE ANSWERS, SEALS, DOSSIERS HERE
 * =============================================================================
 * This is the ARG content file. Logic lives in src/; copy and solutions live here.
 * After changing answers, wipe progress with ?cold=1 so old flags do not stick.
 *
 * QUICK MAP
 *   BLOOD_LYRICS          intercept.html 033.3 poem timestamps
 *   PUZZLE_A / PUZZLE_B   STATUS /outer and /inner
 *   FTH_HUB               Terminal command output strings
 *   OUTER_STATIONS        Hull serials + damage order (INNER code is derived)
 *   CHART_PUZZLES / PLANET_DOSSIERS / SYSTEM_CHART → content/chart-content.js
 *   PARTNER_MORSE         Heixin audio / Chart / /translate
 *   EMPIRE_BLOOD_PHRASE   Terra scrap + Deshret + /translate
 *
 * STORAGE KEY NAMES
 *   ARG_PROGRESS_KEYS — do not rename unless you also wipe old localStorage
 * =============================================================================
 *
 * ARG main path — puzzle solutions & Imperial 9-slot map
 * Edit freely; wipe progress with ?cold=1 after changing solutions.
 */

/* ---------------------------------------------------------------------------
   STATUS progress storage keys (also wiped by progress cold start)
   --------------------------------------------------------------------------- */
export const ARG_PROGRESS_KEYS = {
  hull: "lattice.hull",
  unlock: "lattice.unlock",
  clearanceDraft: "lattice.clearance.draft",
  fragments: "lattice.fragments",
  planets: "lattice.planets",
  /** Shuffled seal ids within veil / neutral / scourge bands */
  sealOrder: "lattice.sealOrder",
  /** Descramble animations already played (persist across channel revisits) */
  descrambled: "lattice.descrambled",
};

/* ---------------------------------------------------------------------------
   Intercept blood carrier poem — typed near 033.3 (carrier-0333.mp3)
   `at` = seconds into the bed (tweak freely)
   --------------------------------------------------------------------------- */
export const BLOOD_LYRICS = [
  { at: 0.21, text: "THE EMPRESS GIVES HER REWARD" },
  { at: 2.34, text: "SO THE FAITHFUL MAY FILL THEIR CUPS" },
  { at: 4.97, text: "A WINE ONLY SHE CAN GIVE" },
  { at: 8.9, text: "SHE CUTS PURITY POURS" },
  { at: 11.3, text: "FROM BENEATH THE SKIN" },
  { at: 13.8, text: "THE IRON RED WITHIN" },
  { at: 18.01, text: "WERE WE TO DO THE SAME" },
  { at: 20.02, text: "THE RESULT WOULD BE A SHAME" },
  { at: 22.7, text: "WHAT IS IT BEING SPILLED?" },
];


/* ---------------------------------------------------------------------------
   Puzzle A — /outer: ship id + khan id unlocks eye (optics flag)
   optics = outer unlocked via /outer
   --------------------------------------------------------------------------- */
export const PUZZLE_A = {
  command: "/outer",
  shipId: "G512",
  /** Accept "S. Raei" / "S.RAEI" / "S RAEI" (spaces optional; period optional) */
  khanId: "S. RAEI",
  promptShip: "ENTR SHIP ID",
  promptKhan: "ENTR KHAN ID",
  successLine: "OUTER AUTH OK — OPTICS BUS ARMED",
  helpLine:
    "CMDS: /help · /outer · /inner · /landing · /fragment · /echo · /translate · /passage",
  unknownLine: "CMD NOT RECOGNIZED — TYPE /help FOR COMMAND LIST",
};

/* ---------------------------------------------------------------------------
   Terminal hub — purposeful instruments only (logic in src/hull.js)
   --------------------------------------------------------------------------- */
export const FTH_HUB = {
  landing: [
    "PROFILE · MARKED BERTH",
    "  ACTUATION // L-1 · L-4 · L-5 · L-2",
    "PROFILE · ROUGH TERRAIN",
    "  ACTUATION // L-2 · L-1 · L-3 · L-5",
    "PROFILE · NEUTRAL",
    "  ACTUATION // L-3 · L-5 · L-6 · L-4",
  ].join("\n"),
  volumeSealed: "FRAGMENT SEALED — CLAIM THAT WORLD'S FRAGMENT FIRST",
  volumeUsage: "USAGE: /fragment <planet>  — confirms fragment after claim",
  celeste: "Turn around.",
  echoOk: [
    "ECHO // DAMAGE ORDER REPLAY",
    "EL0 @ 03:14:08 → WL3 @ 03:29:41 → NR5 @ 03:47:19",
    "TIME RULE // (first digit of each HH) → 760 HEIXIN VOLUME",
    "SERIALS LOGGED // EL0 WL3 NR5",
  ].join("\n"),
  echoNeedInner: "ECHO SEALED — RESTORE INNER FIRST",
  translateUsage: [
    "STATUS // DEGRADED — FULL LEXICON CORRUPTED",
    "PARTIAL LEXICON RECOVERY // EMPIRE MOTTO (EN · AR-LATN · AR · HEX)",
    "PARTIAL LEXICON RECOVERY // MORSE KEY (.-/  ·  EN)",
    "USAGE: /translate <string>",
  ].join("\n"),
  translateMiss: [
    "TRANSLATE // LEXICON MISS",
    "ERR — INPUT NOT IN BOUND CORPUS",
    "HINT // BLOOD PHRASE TABLE · OR PARTNER MORSE ROW",
  ].join("\n"),
};

/* ---------------------------------------------------------------------------
   Puzzle B — /inner: damaged-part serials in damage order
   --------------------------------------------------------------------------- */

/** Shared calendar stamp for all outer damage events */
export const DAMAGE_EPOCH = {
  cycle: 10,
  ae: 1557,
};

export const OUTER_STATIONS = [
  {
    id: "fwd-cam",
    name: "FWD·CAM",
    severity: "ok",
    serial: "FC1",
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "ndl-l",
    name: "NDL·L",
    severity: "ok",
    serial: "NL2",
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "ndl-r",
    name: "NDL·R",
    severity: "warn",
    serial: "NR5",
    damageOrder: 3,
    damageTime: "03:47:19",
  },
  {
    id: "wings-l",
    name: "WINGS L",
    severity: "fault",
    serial: "WL3",
    damageOrder: 2,
    damageTime: "03:29:41",
  },
  {
    id: "wings-r",
    name: "WINGS R",
    severity: "ok",
    serial: "WR4",
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "msl-top",
    name: "MSL·TOP",
    severity: "ok",
    serial: "MT6",
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "aft-cam",
    name: "AFT·CAM",
    severity: "ok",
    serial: "AC7",
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "eng-l",
    name: "ENG·L",
    severity: "crit",
    serial: "EL0",
    damageOrder: 1,
    damageTime: "03:14:08",
  },
  {
    id: "eng-r",
    name: "ENG·R",
    severity: "ok",
    serial: "ER8",
    damageOrder: null,
    damageTime: null,
  },
];

/** Damaged stations sorted by damageOrder ascending */
export const DAMAGED_STATIONS = OUTER_STATIONS.filter(
  (s) => s.severity !== "ok" && s.serial && s.damageOrder != null
).sort((a, b) => a.damageOrder - b.damageOrder);

/** Spaced form shown in the ### ### ### prompt pattern */
export const INNER_CODE = DAMAGED_STATIONS.map((s) => s.serial).join(" ");

export const PUZZLE_B = {
  command: "/inner",
  /** Preferred form (spaces between serials) */
  code: INNER_CODE,
  /** Compact join — normalizeInnerCode accepts both */
  codeCompact: DAMAGED_STATIONS.map((s) => s.serial).join(""),
  damagedCount: DAMAGED_STATIONS.length,
  promptLabel: "DAMAGED PART SERIALS",
  promptMask: "### ### ###",
  successLine: "INNER DIAGNOSTIC PARTITION RESTORED",
  denyLine: "ERR",
};

/* ---------------------------------------------------------------------------
   INNER bays — click to unlock Chart / Flight Log
   --------------------------------------------------------------------------- */
export const PUZZLE_C = {
  bay: "stellar",
  successLine: "SYSTEM MAP BUS ONLINE — STELLAR CHART UNSEALED",
};

export const PUZZLE_D = {
  bay: "personal",
  successLine: "FLIGHT LOG BUS ONLINE — PERSONAL RECORD UNSEALED",
};

export const BAY_UNLOCKS = {
  stellar: {
    unlock: "cartography",
    hullFlag: "chartPuzzle",
    successLine: PUZZLE_C.successLine,
  },
  personal: {
    unlock: "flightlog",
    hullFlag: "logPuzzle",
    successLine: PUZZLE_D.successLine,
  },
};

/* ---------------------------------------------------------------------------
   Partner signal — Heixin Flight Log audio · Chart Morse · /translate
   --------------------------------------------------------------------------- */
export const PARTNER_MORSE = {
  /** `/` = space between letters — matches Log audio "I MISS U" */
  code: "../--/../.../.../..-",
  en: "I MISS U",
  enAlts: ["i miss u", "i miss you", "imiss u", "imissyou", "i m i s s u"],
};

export function normalizeMorseCode(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/[·•]/g, ".")
    .replace(/[—–_]/g, "-")
    .replace(/\|/g, "/")
    .replace(/\s+/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

export function morseCodesMatch(a, b) {
  return normalizeMorseCode(a) === normalizeMorseCode(b);
}

export function decodeMorseLetters(raw) {
  const table = {
    ".-": "A",
    "-...": "B",
    "-.-.": "C",
    "-..": "D",
    ".": "E",
    "..-.": "F",
    "--.": "G",
    "....": "H",
    "..": "I",
    ".---": "J",
    "-.-": "K",
    ".-..": "L",
    "--": "M",
    "-.": "N",
    "---": "O",
    ".--.": "P",
    "--.-": "Q",
    ".-.": "R",
    "...": "S",
    "-": "T",
    "..-": "U",
    "...-": "V",
    ".--": "W",
    "-..-": "X",
    "-.--": "Y",
    "--..": "Z",
  };
  const compact = normalizeMorseCode(raw);
  if (!compact) return "";
  return compact
    .split("/")
    .filter(Boolean)
    .map((sym) => table[sym] ?? "?")
    .join(" ");
}

/* ---------------------------------------------------------------------------
   Empire blood phrase — Terra dossier scrap · Deshret purge · /translate
   --------------------------------------------------------------------------- */
export const EMPIRE_BLOOD_PHRASE = {
  en: "All our blood is red",
  /** English-letter phonetic Arabic (shown in Terra chrono hub) */
  arLatn: "kullu dima'ina ahmar",
  ar: "كُلُّ دِمَائِنَا أَحْمَر",
};

/** UTF-8 hex of the English Empire phrase (no trailing period). */
export function empireBloodPhraseHex() {
  const bytes = new TextEncoder().encode(EMPIRE_BLOOD_PHRASE.en);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/* ---------------------------------------------------------------------------
   Empire seals — Empress purity facets + planet associations
   Bands: veil (Inner), neutral (Center), scourge (Outer)
   Well positions shuffle within each band on cold wipe.
   --------------------------------------------------------------------------- */
export const EMPIRE_SEALS = [
  {
    id: "devotion",
    name: "DEVOTION",
    facet: "Faith and loyalty",
    band: "veil",
    planetId: "qamor",
    planetName: "Qamor",
    fragment: "HIVE",
  },
  {
    id: "erudition",
    name: "ERUDITION",
    facet: "Wisdom and study",
    band: "veil",
    planetId: "ikeph",
    planetName: "Ikeph",
    fragment: "OATH",
  },
  {
    id: "resolution",
    name: "RESOLUTION",
    facet: "Endurance in faith and physical",
    band: "veil",
    planetId: "terra",
    planetName: "Terra",
    fragment: "CARA",
  },
  {
    id: "communion",
    name: "COMMUNION",
    facet: "Oneness with her and the Empire — unity",
    band: "neutral",
    planetId: "deshret",
    planetName: "Deshret",
    fragment: "EXILE",
  },
  {
    id: "justice",
    name: "JUSTICE",
    facet: "Lawfulness; testifying against heresy",
    band: "neutral",
    planetId: "teavicta",
    planetName: "Teavicta",
    fragment: "FAITH",
  },
  {
    id: "ambition",
    name: "AMBITION",
    facet: "Hunger for Empire growth and growing faith",
    band: "neutral",
    planetId: "uros",
    planetName: "Uros",
    fragment: "STURM",
  },
  {
    id: "dominance",
    name: "DOMINANCE",
    facet: "Display of power; crusading",
    band: "scourge",
    planetId: "heixin",
    planetName: "Heixin",
    fragment: "SILENCE",
  },
  {
    id: "sacrifice",
    name: "SACRIFICE",
    facet: "Giving up things for Empire",
    band: "scourge",
    planetId: "haider",
    planetName: "Haider",
    fragment: "SPIKE",
  },
  {
    id: "vengeance",
    name: "VENGEANCE",
    facet: "Wrath against foes and heretics",
    band: "scourge",
    planetId: "vol",
    planetName: "Vol",
    fragment: "VESPER",
  },
];

/** Physical Imperial wells by band (left / mid / right triangles). */
export const SEAL_BANDS = {
  veil: {
    label: "Inner / Veil",
    wellSlots: [1, 2, 3],
    sealIds: ["devotion", "erudition", "resolution"],
  },
  neutral: {
    label: "Center / Neutral",
    wellSlots: [4, 5, 6],
    sealIds: ["communion", "justice", "ambition"],
  },
  scourge: {
    label: "Outer / Scourge",
    wellSlots: [7, 8, 9],
    sealIds: ["dominance", "sacrifice", "vengeance"],
  },
};

/**
 * Lookup helpers for seals / fragments (Chart · Imperial · Terminal).
 */
export function sealById(id) {
  return EMPIRE_SEALS.find((s) => s.id === id) ?? null;
}

export function sealByPlanetId(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  return EMPIRE_SEALS.find((s) => s.planetId === id) ?? null;
}

/** Resolve a seal from a recovered fragment word (tray / /fragment). */
export function sealByFragment(fragment) {
  const f = String(fragment ?? "")
    .trim()
    .toUpperCase()
    .replace(/[▽▼\s]+/g, "");
  return EMPIRE_SEALS.find((s) => s.fragment === f) ?? null;
}

/**
 * Canon rows for fragment / planet lookup (draft keys still use well slot 1–9).
 * On-screen seal order comes from getSealWellAssignments() after shuffle.
 */
export const IMPERIAL_SLOTS = EMPIRE_SEALS.map((s, i) => ({
  slot: i + 1,
  sealId: s.id,
  sealName: s.name,
  band: s.band,
  planetId: s.planetId,
  planetName: s.planetName,
  fragment: s.fragment,
  keywords: [s.planetId, s.fragment.toLowerCase()],
}));
