/**
 * ARG main path — puzzle solutions & Imperial 9-slot map
 * Edit freely; wipe progress with ?cold=1 after changing solutions.
 */

/* ---------------------------------------------------------------------------
   STATUS progress storage keys (also listed in cold-start wipe list)
   --------------------------------------------------------------------------- */
export const ARG_PROGRESS_KEYS = {
  hull: "lattice.hull",
  unlock: "lattice.unlock",
  clearanceDraft: "lattice.clearance.draft",
  fragments: "lattice.fragments",
};

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
  helpLine: "CMDS: /help · /outer · /inner",
  unknownLine: "CMD NOT RECOGNIZED — TYPE /help FOR COMMAND LIST",
};

/* ---------------------------------------------------------------------------
   Puzzle B — /inner: damaged-part serials in damage order
   Serials are 3 chars (two letters + digit). Accept spaced or compact entry.
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
    serial: null,
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "ndl-l",
    name: "NDL·L",
    severity: "ok",
    serial: null,
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
    serial: null,
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "msl-top",
    name: "MSL·TOP",
    severity: "ok",
    serial: null,
    damageOrder: null,
    damageTime: null,
  },
  {
    id: "aft-cam",
    name: "AFT·CAM",
    severity: "ok",
    serial: null,
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
    serial: null,
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
   INNER bays — click to unlock Chart / Flight Log (replaces removed /bay)
   --------------------------------------------------------------------------- */
export const PUZZLE_C = {
  bay: "stellar",
  successLine: "STELLAR FIX BUS ONLINE — SYSTEM CHART UNSEALED",
};

export const PUZZLE_D = {
  bay: "personal",
  successLine: "PERSONAL RECORD BUS ONLINE — FLIGHT LOG UNSEALED",
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
   Imperial Clearance — 9 slots (orbital inward → outward)
   Layer A: planet id · Layer B: fragment string (case-insensitive)
   Journals folded onto nine primary worlds (see _internal/arg/main-path.md)
   --------------------------------------------------------------------------- */
export const IMPERIAL_SLOTS = [
  {
    slot: 1,
    planetId: "qamor",
    planetName: "Qamor",
    journalId: "j-qamor",
    fragment: "A1",
    volumeCode: "512",
    keywords: ["qamor", "seed"],
  },
  {
    slot: 2,
    planetId: "ikeph",
    planetName: "Ikeph",
    journalId: "j-ikeph",
    fragment: "B2",
    volumeCode: "215",
    keywords: ["ikeph"],
  },
  {
    slot: 3,
    planetId: "terra",
    planetName: "Terra",
    journalId: "j-terra",
    fragment: "C3",
    volumeCode: "320",
    keywords: ["terra"],
  },
  {
    slot: 4,
    planetId: "deshret",
    planetName: "Deshret",
    journalId: "j-deshret",
    fragment: "D4",
    volumeCode: "430",
    keywords: ["deshret", "embrace"],
  },
  {
    slot: 5,
    planetId: "teavicta",
    planetName: "Teavicta",
    journalId: "j-kaph",
    fragment: "E5",
    volumeCode: "540",
    keywords: ["kaph", "teavicta"],
  },
  {
    slot: 6,
    planetId: "uros",
    planetName: "Uros",
    journalId: "j-uros-belt",
    fragment: "F6",
    volumeCode: "650",
    keywords: ["uros", "belt"],
  },
  {
    slot: 7,
    planetId: "heixin",
    planetName: "Heixin",
    journalId: "j-heixin",
    fragment: "G7",
    volumeCode: "760",
    keywords: ["heixin"],
  },
  {
    slot: 8,
    planetId: "haider",
    planetName: "Haider",
    journalId: "j-spike",
    fragment: "H8",
    volumeCode: "870",
    keywords: ["haider", "spike"],
  },
  {
    slot: 9,
    planetId: "vol",
    planetName: "Vol",
    journalId: "j-sturm",
    fragment: "I9",
    volumeCode: null,
    keywords: ["vol", "edge"],
  },
];

/** Chart dossier blurbs — slot index is the teachable tell */
export const PLANET_DOSSIERS = Object.fromEntries(
  IMPERIAL_SLOTS.map((s) => [
    s.planetId,
    {
      title: s.planetName.toUpperCase(),
      slotMark: `▽ ${String(s.slot).padStart(2, "0")} // BIND`,
      body: `Orbital index ${s.slot} of 9. Imperial well expects this bind order. Volume echo: ${s.journalId}.`,
    },
  ])
);
