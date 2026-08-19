/**
 * =============================================================================
 * chart-content.js — ALL SYSTEM CHART DISPLAY COPY
 * =============================================================================
 * Edit this file for every text panel in Cartography (Stellar Chart):
 *
 *   CHART_SHELL     — idle / error / system archive footer
 *   SYSTEM_CHART    — orbit map geometry + moon readouts
 *   PLANET_DOSSIERS — unlocked planet writeups (post-puzzle)
 *   CHART_PUZZLES   — lock UI copy + puzzle data (prompt, hint, answers)
 *   PLANET_NAME_ALIASES — optional extra strings corrupted in prose until unlock
 *                        (current planet names only — not historical puzzle answers)
 *
 * UI mapping (readout panel):
 *   chart__idle              ← CHART_SHELL.idle
 *   chart__error             ← CHART_SHELL.error
 *   chart-archive__*         ← CHART_SHELL.archive (always static — no planet hooks)
 *   chart-sturm__name        ← SYSTEM_CHART.sturm.name
 *   chart-sturm__meta        ← SYSTEM_CHART.sturm.meta   (subheader line)
 *   chart-sturm__blurb       ← SYSTEM_CHART.sturm.blurb  (body)
 *   chart__mystery           ← SYSTEM_CHART.mystery.readout
 *   chart-dossier__title     ← PLANET_DOSSIERS[id].title
 *   chart-dossier__slot      ← seal name (after Imperial bind — not edited here)
 *   chart-dossier__body      ← PLANET_DOSSIERS[id].facts
 *   chart-dossier__body--seal← PLANET_DOSSIERS[id].sealWhy
 *   chart-lock__title        ← planet name (scrambled until unlock)
 *   chart-lock__prompt       ← CHART_PUZZLES[id].prompt
 *   chart-lock__hint         ← CHART_PUZZLES[id].hint
 *
 * Puzzle mechanics only (types, grids, node ids) live here too — keep answers
 * aligned with STATUS / Terminal verbs in content/arg-path.js.
 * =============================================================================
 */

import { EMPIRE_BLOOD_PHRASE, PARTNER_MORSE } from "./arg-path.js";

/* ---------------------------------------------------------------------------
   CHART_SHELL — global readout / archive chrome
   --------------------------------------------------------------------------- */
export const CHART_SHELL = {
  /** Shown when no body is selected */
  idle: "SELECT ORBITAL BODY",
  /** Fallback when a body has no dossier or puzzle */
  error: "GYROSCOPIC DATA SYNC ERROR",
  /** Bottom SYSTEM ARCHIVE panel — same copy for every planet */
  archive: {
    title: "SYSTEM ARCHIVE",
    code: "CART.ARCHIVE // STATUS=NONFUNCTIONAL",
    body:
      "Archive mesh is still repairing after impact. Planetary extracts and cross-indexed memory are inaccessible.",
  },
};

/* ---------------------------------------------------------------------------
   SYSTEM_CHART — map geometry + moon readouts
   r / angle / size = SVG orbit layout (do not need prose edits)
   --------------------------------------------------------------------------- */
export const SYSTEM_CHART = {
  idle: CHART_SHELL.idle,
  error: CHART_SHELL.error,
  archive: CHART_SHELL.archive,

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

  /* ----- MOON — STURM (free readout, no Chart purge) ----- */
  sturm: {
    id: "sturm",
    name: "Sturm",
    parent: "uros",
    offset: 16,
    angle: 48,
    /** Subheader under the moon name (chart-sturm__meta) */
    meta: "UROS · CURRENT LOC ▽",
    /** Body paragraph (chart-sturm__blurb) */
    blurb:
      `Sturm is one of many moons of Uros considered to be Splinter Nation territory. It is also considered one of the most habitable moons in Uros' orbit. It hovers closer to its parent's surface than its brother and sister moons, being within the inner orbit closer to Uros' rings. The moon has an extensive history that has resulted in its current environment.
      <br><br>
      Most Uros moons are rather cold due to their distance from the central sun. However, Sturm's atmosphere and ozone layer serve to magnify the rays of the sun, leading to the moon being far hotter than its siblings and therefore developing a vastly different environment with its own water cycle. Sturm's surface is primarily white sands, broken up by dense rainforests. These forests are most prevalent in areas where the sun's heat is most concentrated. Water often gets 'trapped' within these forests' radius, making them places where life can thrive. The coolest regions of the moon would be at either pole, where there are large collections of ice over miles of water.
      <br><br>
      Sturm's unique environment is the result of events that took place when its parent planet went by an older name: <b>Zezura</b>. During the First Belt War, the Empire launched Holy Crusades in Zezurian Belt Orbit to claim contested territory. However, resistance from old Zezura resulted in this planet getting its name, meaning Storm. A place of great turbulence. This conflict impeded the Empire's efforts to terraform and claim the moon, but did not cease them entirely. When the First Belt War came to an end, Sturm was in turn abandoned, and all that was left there would be the dregs of the Zezurian crusades. The moon is a residual, its population hailing from all over the system, and its environment a mixture of environments made by incomplete terraforming and great battles. `,
  },

  /* ----- MOON — NU LUNAE / ENKIDU-1 (Teavicta ? mark) ----- */
  mystery: {
    id: "teavicta-mystery",
    parent: "teavicta",
    offset: 18,
    angle: -72,
    mark: "?",
    /** Full readout when the ? moon is selected */
    readout: "NU LUNAE // ENKIDU-1 — DATA INACCESSIBLE",
  },
};

/**
 * Alternate names treated as the same world for prose scrambling.
 * Keys = planet id from `bodies`. Only the modern chart name is scrambled —
 * do not list historical names or puzzle answers here (e.g. Zezura for Uros).
 */
export const PLANET_NAME_ALIASES = {};

/* ---------------------------------------------------------------------------
   PLANET_DOSSIERS — unlocked writeups (The Nine)
   title   → chart-dossier__title (planet name header)
   facts   → first body paragraph
   sealWhy → second body paragraph (ends on seal name)
   sealId  → links to Dominion Seal (not shown as text until Imperial bind)
   --------------------------------------------------------------------------- */
export const PLANET_DOSSIERS = {
  /* ----- PLANET — QAMOR ----- */
  qamor: {
    title: "QAMOR",
    sealId: "devotion",
    facts:
      `The planet closest to The Nine's sun, it is one of the hottest worlds in The Nine, while also dropping to some of the coldest temperatures during nightfall. Qamor's surface inhospitability made it difficult to grow colonies or terraform the planet, even with Empire technology. As such, the primary purpose of Qamor quickly became the harvest of its resources: primarily metal. The planet has been under complete Empire control for generations, and in that time the entirety of the planet has been converted into the largest mining site in The Nine. Eighty-five percent of Qamor's population is composed of working miners who live and work beneath the surface.
      <br><br>
      The metal harvested from the planet accounts for a massive portion of the Empire's weapon, armor, and vehicle production. Additionally, what gasses are harvested are also exported for the purpose of other technologies, including agriculture.`,
    sealWhy:
      `The seal of <b>Devotion</b> is represented by Qamor. The faith and loyalty to the Empress of the population of Qamor carriers is from which Arkhidian derives its resources and vast armory.`
  },

  /* ----- PLANET — IKEPH ----- */
  ikeph: {
    title: "IKEPH",
    sealId: "erudition",
    facts:
      `Ikeph is the second-closest planet to the center of the Nine. The planet has been under Arkhidian control since the Empire's inception. Its name, meaning "Great Forest", was given to it on account of Ikeph possessing the densest biosphere among The Nine. 
      <br><br>
      While Deshret was the first planet to be fully terraformed, Ikeph crusades and terraformation took place concurrently. As such, Ikeph's current environment is the result of several hundred years of Arkhidian terraformation and testing. In fact, Ikeph's terraformation made it one of the earliest planets to develop a breathable atmosphere. Ikeph would go on to be used to produce a breathable atmosphere for multiple Empire-owned celestial bodies. However, the primary export of the planet is not its breathable gas, but instead the great deal of food that is produced on its surface.
      <br><br>
      Ikeph's dense biosphere includes both wildlife and plant life, all of which is contributed to by the humidity of the planet. When it is not incredibly hot and sunny, the planet has persistently aggressive storms.`,
    sealWhy:
      `The seal of <b>Erudition</b> is represented by Ikeph.  Wisdom and knowledge of the Empress's laws and her faith are what have allowed the planet to thrive and support the Empire's ration stores. In fact, the terraformation of the planet began with the construction of the first Scarlet Church.`,
  },

  /* ----- PLANET — TERRA ----- */
  terra: {
    title: "TERRA",
    sealId: "resolution",
    facts: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum rhoncus est pellentesque elit ullamcorper dignissim cras tincidunt lobortis feugiat vivamus at augue eget arcu dictum varius duis at consectetur. Empire scrap still stamps the blood creed in phonetic Arabic — ${EMPIRE_BLOOD_PHRASE.arLatn}.`,
    sealWhy:
      "Lorem mollis aliquam ut porttitor leo a diam sollicitudin tempor id eu nisl nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit amet risus nullam eget felis eget nunc Resolution.",
  },

  /* ----- PLANET — DESHRET ----- */
  deshret: {
    title: "DESHRET",
    sealId: "communion",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Massa tincidunt dui ut ornare lectus sit amet est placerat in egestas erat imperdiet sed euismod nisi porta lorem mollis aliquam ut porttitor.",
    sealWhy:
      "Amet nisl suscipit adipiscing bibendum est ultricies integer quis auctor elit sed vulputate mi sit amet mauris commodo quis imperdiet massa tincidunt nunc pulvinar sapien et Communion.",
  },

  /* ----- PLANET — TEAVICTA ----- */
  teavicta: {
    title: "TEAVICTA",
    sealId: "justice",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Turpis egestas integer eget aliquet nibh praesent tristique magna sit amet purus gravida quis blandit turpis cursus in hac habitasse platea dictumst.",
    sealWhy:
      "Quis enim lobortis scelerisque fermentum dui faucibus in ornare quam viverra orci sagittis eu volutpat odio facilisis mauris sit amet massa vitae tortor condimentum lacinia Justice.",
  },

  /* ----- PLANET — UROS ----- */
  uros: {
    title: "UROS",
    sealId: "ambition",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum sagittis vitae et leo duis ut diam quam nulla porttitor massa id neque aliquam vestibulum morbi blandit cursus risus at ultrices.",
    sealWhy:
      "Mi sit amet mauris commodo quis imperdiet massa tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada proin libero nunc consequat interdum varius sit amet mattis Ambition.",
  },

  /* ----- PLANET — HEIXIN ----- */
  heixin: {
    title: "HEIXIN",
    sealId: "dominance",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Semper auctor neque vitae tempus quam pellentesque nec nam aliquam sem et tortor consequat id porta nibh venenatis cras sed felis eget.",
    sealWhy:
      "Volutpat ac tincidunt vitae semper quis lectus nulla at volutpat diam ut venenatis tellus in metus vulputate eu scelerisque felis imperdiet proin fermentum leo vel Dominance.",
  },

  /* ----- PLANET — HAIDER ----- */
  haider: {
    title: "HAIDER",
    sealId: "sacrifice",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Risus nullam eget felis eget nunc lobortis mattis aliquam faucibus purus in massa tempor nec feugiat nisl pretium fusce id velit ut.",
    sealWhy:
      "Tortor dignissim convallis aenean et tortor at risus viverra adipiscing at in tellus integer feugiat scelerisque varius morbi enim nunc faucibus a pellentesque sit amet Sacrifice.",
  },

  /* ----- PLANET — VOL ----- */
  vol: {
    title: "VOL",
    sealId: "vengeance",
    facts:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Enim nulla aliquet porttitor lacus luctus accumsan tortor posuere ac ut consequat semper viverra nam libero justo laoreet sit amet cursus.",
    sealWhy:
      "Sit amet dictum sit amet justo donec enim diam vulputate ut pharetra sit amet aliquam id diam maecenas ultricies mi eget mauris pharetra et ultrices neque Vengeance.",
  },
};

/* ---------------------------------------------------------------------------
   CHART_PUZZLES — lock UI + puzzle data (The Nine)
   prompt → chart-lock__prompt (shared purge header on most worlds)
   hint   → chart-lock__hint
   --------------------------------------------------------------------------- */
export const CHART_PUZZLES = {
  /* ----- PLANET — QAMOR ----- */
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
    answer: ["L-2", "L-1", "L-3", "L-5"],
  },

  /* ----- PLANET — IKEPH ----- */
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
    answer: ["l0", "l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"],
  },

  /* ----- PLANET — TERRA ----- */
  terra: {
    type: "chrono-rings",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Complete chronoal realignment",
  },

  /* ----- PLANET — DESHRET ----- */
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

  /* ----- PLANET — TEAVICTA ----- */
  teavicta: {
    type: "cardinal-eye",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Cardinal realignment required",
    answer: ["E", "W", "N", "S"],
  },

  /* ----- PLANET — UROS ----- */
  uros: {
    type: "text",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recovery key // Original designation",
    answers: ["zezura", "Zezura", "ZEZURA"],
  },

  /* ----- PLANET — HEIXIN ----- */
  heixin: {
    type: "morse-translate",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Carrier decode // Partner signal",
    morse: PARTNER_MORSE.code,
    answers: [PARTNER_MORSE.en, ...PARTNER_MORSE.enAlts],
  },

  /* ----- PLANET — HAIDER ----- */
  haider: {
    type: "lights-out",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Recover data blocks",
    rows: 3,
    cols: 5,
    start: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    goal: "all-on",
  },

  /* ----- PLANET — VOL ----- */
  vol: {
    type: "orbit-order",
    prompt: "CORRUPTION PURGE QUERY",
    hint: "Resync celestial structure",
    requireDossiers: 3,
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

/** Correct Ikeph reorder verse — used by STATUS /passage (hull.js). */
export function getIkephPassageLines() {
  const puzzle = CHART_PUZZLES.ikeph;
  if (!puzzle?.answer?.length) return [];
  const byId = Object.fromEntries((puzzle.lines ?? []).map((l) => [l.id, l.text]));
  return puzzle.answer.map((id) => byId[id]).filter(Boolean);
}
