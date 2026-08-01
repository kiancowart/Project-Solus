/**
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
    "CMDS: /help · /outer · /inner · /landing · /volume · /protocol · /echo · /moon · /edge · /translate · /passage",
  unknownLine: "CMD NOT RECOGNIZED — TYPE /help FOR COMMAND LIST",
};

/* ---------------------------------------------------------------------------
   Terminal hub — purposeful instruments only (logic in src/hull.js)
   --------------------------------------------------------------------------- */
export const FTH_HUB = {
  landing: [
    "LANDING GEAR BUS // LEGS L-1 … L-6",
    "PROFILE · PAD-GRADE APRON (MARKED BERTH)",
    "  ACTUATION // L-1 · L-4 · L-5 · L-2",
    "PROFILE · SPOIL / BROKEN STRATA (ROUGH TERRAIN)",
    "  ACTUATION // L-2 · L-1 · L-3 · L-5",
    "PROFILE · DUST-FLAT BERTH (UNMARKED NATURAL)",
    "  ACTUATION // L-3 · L-5 · L-6 · L-4",
  ].join("\n"),
  volumeSealed: "VOLUME INDEX SEALED — CLAIM THAT WORLD'S FRAGMENT FIRST",
  volumeUsage: "USAGE: /volume <planet>  — confirms fragment after claim",
  celeste: "Turn around.",
  protocolPrompt: "ENTR STORM PROTOCOL PHRASE",
  protocolAnswers: ["unconquered", "unconquered storm", "teavicta"],
  protocolOk: [
    "PROTOCOL OK — STORM AUTH CLEARED",
    "AUTH RESIDUE // VOLUME INDEX 540",
  ].join("\n"),
  protocolDeny: "ERR — PROTOCOL REJECTED",
  echoOk: [
    "ECHO // DAMAGE ORDER REPLAY",
    "EL0 @ 03:14:08 → WL3 @ 03:29:41 → NR5 @ 03:47:19",
    "TIME RULE // (first digit of each HH) → 760 HEIXIN VOLUME",
    "SERIALS LOGGED // EL0 WL3 NR5",
  ].join("\n"),
  echoNeedInner: "ECHO SEALED — RESTORE INNER FIRST",
  moonUsage: "USAGE: /moon <name>  — prison-moon ledger lookup",
  moonKaph: [
    "MOON LEDGER // KAPH",
    "CATALOG ID // 430",
    "PARENT // DESHRET",
  ].join("\n"),
  moonUnknown: "ERR — NO MOON INDEX UNDER THAT NAME",
  edgePrompt: "ENTR DEAD CARRIER",
  edgeAnswers: ["097.9", "0979", "97.9"],
  edgeOk: [
    "EDGE CARRIER LOCKED",
    "TOKEN // NONUS-EDGE",
    "VOLUME INDEX // 980",
  ].join("\n"),
  edgeDeny: "ERR — CARRIER DEAD",
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
   Chart puzzles — unlock dossier (seal order) only; not Terminal residue crumbs
   --------------------------------------------------------------------------- */
export const CHART_PUZZLES = {
  qamor: {
    type: "sequence",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recompile mining planet landing profile",
    nodes: [
      { id: "L-1", label: "L-1" },
      { id: "L-2", label: "L-2" },
      { id: "L-3", label: "L-3" },
      { id: "L-4", label: "L-4" },
      { id: "L-5", label: "L-5" },
      { id: "L-6", label: "L-6" },
    ],
    /** Spoil / broken strata (rough) actuation from /landing */
    answer: ["L-2", "L-1", "L-3", "L-5"],
  },
  ikeph: {
    type: "reorder",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recompile archive anchor passage",
    lines: [
      { id: "l5", text: "THE IRON RED WITHIN", glyph: "▒HE IRON R▒▪ WITHIN" },
      {
        id: "l1",
        text: "SO THE FAITHFUL MAY FILL THEIR CUPS",
        glyph: "SO TH□ FAITHFUL MAY ▓▫■L T▄EIR CUP░",
      },
      {
        id: "l7",
        text: "THE RESULT WOULD BE A SHAME",
        glyph: "THE R▪SULT WOU▒D BE █ SHA▪E",
      },
      {
        id: "l0",
        text: "THE EMPRESS GIVES HER REWARD",
        glyph: "▄HE EMPRE□▄ GIVES H□▄ REWARD",
      },
      { id: "l3", text: "SHE CUTS PURITY POURS", glyph: "▀HE CUT▄ P▀RITY POU▪S" },
      {
        id: "l8",
        text: "BLOOD IS WHAT IS BEING SPILLED",
        glyph: "BLO□D ▪S WHAT I▒ BEING SP▒LL▓D",
      },
      {
        id: "l2",
        text: "A WINE ONLY SHE CAN GIVE",
        glyph: "A WI▀E ■N░Y SHE CAN GIV▪",
      },
      { id: "l6", text: "WERE WE TO DO THE SAME", glyph: "WERE W░ TO ▀O THE ▄AME" },
      { id: "l4", text: "FROM BENEATH THE SKIN", glyph: "FR█M BE▪E▓TH THE ▪KIN" },
    ],
    /** Blood carrier verse — final line restated (not a question) */
    answer: ["l0", "l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"],
  },
  terra: {
    type: "chrono-rings",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Complete chronoal realignment",
  },
  deshret: {
    type: "text",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recovery key // Empire phrase",
    answers: [
      EMPIRE_BLOOD_PHRASE.en,
      `${EMPIRE_BLOOD_PHRASE.en}.`,
      "all our blood is red",
      "all our blood is red.",
    ],
  },
  teavicta: {
    type: "cardinal-eye",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Cardinal realignment required",
    /** Compass starts East; each correct look advances the ribbon. */
    answer: ["E", "W", "N", "S"],
  },
  uros: {
    type: "text",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recovery key // Original designation",
    answers: ["zezura", "Zezura", "ZEZURA"],
  },
  heixin: {
    type: "morse-translate",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Carrier decode // Partner signal",
    morse: PARTNER_MORSE.code,
    answers: [PARTNER_MORSE.en, ...PARTNER_MORSE.enAlts],
  },
  haider: {
    type: "lights-out",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recover data blocks",
    rows: 3,
    cols: 5,
    /**
     * PDTA-style 3×5 lights: click toggles self + orthogonal neighbors.
     * Starts all dark; solved when every cell is lit.
     */
    start: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    goal: "all-on",
  },
  vol: {
    type: "orbit-order",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Resync celestial structure",
    /** Tray / commit require this many other dossier purges. */
    requireDossiers: 3,
    /** Full inner → outer reference (subset ranked from this). */
    answer: [
      "qamor",
      "ikeph",
      "terra",
      "deshret",
      "teavicta",
      "uros",
      "heixin",
      "haider",
      "vol",
    ],
  },
};

/** Correct Ikeph reorder verse (Empress reward / blood passage). */
export function getIkephPassageLines() {
  const puzzle = CHART_PUZZLES.ikeph;
  if (!puzzle?.answer?.length) return [];
  const byId = Object.fromEntries((puzzle.lines ?? []).map((l) => [l.id, l.text]));
  return puzzle.answer.map((id) => byId[id]).filter(Boolean);
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

/** Resolve a seal from a recovered fragment word (tray / /volume). */
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

/**
 * Chart dossiers — edit planet-by-planet.
 * `facts` = planetary description (para 1).
 * `sealWhy` = why this seal fits; end on the seal name (para 2).
 * Yellow seal header under the title only after Imperial bind.
 *
 * Sturm’s free blurb lives in SYSTEM_CHART.sturm (content/boot-content.js).
 */
export const PLANET_DOSSIERS = {
  qamor: {
    title: "QAMOR",
    sealId: "devotion",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    sealWhy:
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est Devotion.",
  },
  ikeph: {
    title: "IKEPH",
    sealId: "erudition",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio praesent libero sed cursus ante dapibus diam, sed nisi nulla at volutpat diam ut venenatis tellus in metus vulputate eu scelerisque.",
    sealWhy:
      "Felisi donec et odio pellentesque diam volutpat commodo sed egestas egestas fringilla phasellus faucibus scelerisque eleifend donec pretium vulputate sapien nec sagittis aliquam malesuada bibendum Erudition.",
  },
  terra: {
    title: "TERRA",
    sealId: "resolution",
    facts:
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras tincidunt lobortis feugiat vivamus at augue eget arcu dictum varius duis at consectetur. Empire scrap still stamps the blood creed in phonetic Arabic — ${EMPIRE_BLOOD_PHRASE.arLatn}.`,
    sealWhy:
      "Lorem mollis aliquam ut porttitor leo a diam sollicitudin tempor id eu nisl nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit amet risus nullam eget felis eget nunc Resolution.",
  },
  deshret: {
    title: "DESHRET",
    sealId: "communion",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa tincidunt dui ut ornare lectus sit amet est placerat in egestas erat imperdiet sed euismod nisi porta lorem mollis aliquam ut porttitor.",
    sealWhy:
      "Amet nisl suscipit adipiscing bibendum est ultricies integer quis auctor elit sed vulputate mi sit amet mauris commodo quis imperdiet massa tincidunt nunc pulvinar sapien et Communion.",
  },
  teavicta: {
    title: "TEAVICTA",
    sealId: "justice",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Turpis egestas integer eget aliquet nibh praesent tristique magna sit amet purus gravida quis blandit turpis cursus in hac habitasse platea dictumst.",
    sealWhy:
      "Quis enim lobortis scelerisque fermentum dui faucibus in ornare quam viverra orci sagittis eu volutpat odio facilisis mauris sit amet massa vitae tortor condimentum lacinia Justice.",
  },
  uros: {
    title: "UROS",
    sealId: "ambition",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum sagittis vitae et leo duis ut diam quam nulla porttitor massa id neque aliquam vestibulum morbi blandit cursus risus at ultrices.",
    sealWhy:
      "Mi sit amet mauris commodo quis imperdiet massa tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada proin libero nunc consequat interdum varius sit amet mattis Ambition.",
  },
  heixin: {
    title: "HEIXIN",
    sealId: "dominance",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Semper auctor neque vitae tempus quam pellentesque nec nam aliquam sem et tortor consequat id porta nibh venenatis cras sed felis eget.",
    sealWhy:
      "Volutpat ac tincidunt vitae semper quis lectus nulla at volutpat diam ut venenatis tellus in metus vulputate eu scelerisque felis imperdiet proin fermentum leo vel Dominance.",
  },
  haider: {
    title: "HAIDER",
    sealId: "sacrifice",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Risus nullam eget felis eget nunc lobortis mattis aliquam faucibus purus in massa tempor nec feugiat nisl pretium fusce id velit ut.",
    sealWhy:
      "Tortor dignissim convallis aenean et tortor at risus viverra adipiscing at in tellus integer feugiat scelerisque varius morbi enim nunc faucibus a pellentesque sit amet Sacrifice.",
  },
  vol: {
    title: "VOL",
    sealId: "vengeance",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Enim nulla aliquet porttitor lacus luctus accumsan tortor posuere ac ut consequat semper viverra nam libero justo laoreet sit amet cursus.",
    sealWhy:
      "Sit amet dictum sit amet justo donec enim diam vulputate ut pharetra sit amet aliquam id diam maecenas ultricies mi eget mauris pharetra et ultrices neque Vengeance.",
  },
};
