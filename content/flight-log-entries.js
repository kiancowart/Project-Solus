/**
 * =============================================================================
 * flight-log-entries.js — ALL FLIGHT LOG DISPLAY COPY
 * =============================================================================
 * Edit this file for every text panel in the Flight Log channel.
 *
 * ENTRY FIELDS (reader panel mapping)
 *   title     → flog-reader__title / flog-entry__title     (index row label)
 *   date      → flog-reader__date / flog-entry__date       (DATE subheader)
 *   location  → LOCATION subheader on filler entries only
 *   planetId  → ties entry to a Chart world (fragment entries only)
 *   fragment  → seal word — wrap as [[WORD]] in body for Imperial tray click
 *   audio     → optional MP3 path
 *   body      → main prose (spread pages)
 *
 * FRAGMENT ENTRIES (nine total — one per EMPIRE_SEALS planet)
 *   Use planetId + fragment. LOCATION auto-derives from seal planetName until
 *   that world's Chart dossier is unlocked (then descrambles).
 *   Do not set location on fragment rows.
 *
 * FILLER ENTRIES
 *   location string only — planetId: null, fragment: null.
 *
 * FRAGMENT WORDS come from EMPIRE_SEALS in arg-path.js (FRAG_BY_PLANET).
 * =============================================================================
 */

import { EMPIRE_SEALS, PARTNER_MORSE } from "./arg-path.js";

const FRAG_BY_PLANET = Object.fromEntries(
  EMPIRE_SEALS.map((s) => [s.planetId, s.fragment])
);

/* ---------------------------------------------------------------------------
   FLIGHT LOG UI — channel idle state (no entry selected)
   --------------------------------------------------------------------------- */
export const FLIGHT_LOG_UI = {
  /** Index placeholder when nothing is selected */
  idle: "SELECT LOG ENTRY",
  /** Hint under the idle line */
  idleHint:
    "All entries are open. Search filters the index.\nNine carry seal fragments — bold boxed words.\nThose nine keep location scrambled until that world's Chart puzzle is solved.\nClick a fragment to load the Imperial tray.",
};

/* ---------------------------------------------------------------------------
   FLIGHT LOG ENTRIES — chronological (18 total)
   9 fragment/planet entries + 9 narrative entries
   --------------------------------------------------------------------------- */
export const FLIGHT_LOG_ENTRIES = [
  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-01",
    title: "WAKE PROTOCOL",
    date: "1541.02.11",
    location: "CARA · HAB",
    planetId: null,
    fragment: null,
    body:
      "Cara boots cold. Lattice hum under the floor plates. No seal work today — just learning which lights mean stay alive.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },

  /* ----- MOON — STURM / planet UROS (fragment entry) ----- */
  {
    id: "flog-02",
    title: "BELT STATIC",
    date: "1541.03.02",
    planetId: "uros",
    fragment: FRAG_BY_PLANET.uros,
    body: `Sturm weather claws the outer belt. Ore scrap sings through the hull. Search the noise for [[${FRAG_BY_PLANET.uros}]] if you still believe in names.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.`,
  },

  /* ----- PLANET — QAMOR (fragment entry) ----- */
  {
    id: "flog-03",
    title: "FIRST INDUSTRY",
    date: "1541.04.19",
    planetId: "qamor",
    fragment: FRAG_BY_PLANET.qamor,
    body: `Qamor never sleeps. Trains, flares, soft indexes under hard labor. The scrap this volume hides answers to [[${FRAG_BY_PLANET.qamor}]].\n\nFusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.`,
  },

  /* ----- PLANET — IKEPH (fragment entry) ----- */
  {
    id: "flog-04",
    title: "CANOPY NOTES",
    date: "1541.05.07",
    planetId: "ikeph",
    fragment: FRAG_BY_PLANET.ikeph,
    body: `Ikeph canopy keeps the tables fed. Study houses smell like sap and ink. The vow under the leaves is [[${FRAG_BY_PLANET.ikeph}]].\n\nCurabitur sodales ligula in libero. Sed dignissim laciniae nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis.`,
  },

  /* ----- PLANET — TERRA (fragment entry) ----- */
  {
    id: "flog-05",
    title: "CRADLE MEMORY",
    date: "1541.06.22",
    planetId: "terra",
    fragment: FRAG_BY_PLANET.terra,
    body: `Terra workshops remember more than people do. Machines dreaming of flesh, flesh dreaming of machines — and I keep saying her name into the recorder — [[${FRAG_BY_PLANET.terra}]] — like a machine prayer.\n\nResolution is not a sermon here. It is a hull that refuses to fold. Chrono drift on Lattice is the real tell — hours and minutes lie until you realign them.\n\nSTATUS still stamps ok stations FC1 · NL2 · WR4. Pretty serials. They are not the Chart purge.\n\nJunk: glyph · neon · triad · outerbelt · 870.`,
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-06",
    title: "MESS HALL RUMOR",
    date: "1541.07.03",
    location: "CARA · MESS",
    planetId: null,
    fragment: null,
    body:
      "Someone claimed the Empress keeps nine seals like nine knives. Someone else laughed. I filed both under noise.\n\nMauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra.",
  },

  /* ----- PLANET — DESHRET (fragment entry) ----- */
  {
    id: "flog-07",
    title: "DESERT ROAD",
    date: "1541.08.14",
    planetId: "deshret",
    fragment: FRAG_BY_PLANET.deshret,
    body: `Dust ports and prison-moon shadow. Even the road that throws you out still belongs to her. Mark: [[${FRAG_BY_PLANET.deshret}]].\n\nNam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti.`,
  },

  /* ----- PLANET — TEAVICTA (fragment entry) ----- */
  {
    id: "flog-08",
    title: "RED STORM WATCH",
    date: "1541.09.01",
    planetId: "teavicta",
    fragment: FRAG_BY_PLANET.teavicta,
    body: `Teavicta's red storm is a watching eye. Protocol weather. Testify or be weather. The word under the lightning is [[${FRAG_BY_PLANET.teavicta}]].\n\nNunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam. Etiam ultrices. Suspendisse in justo eu magna luctus suscipit. Sed lectus.`,
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-09",
    title: "SUPPLY SHORT",
    date: "1541.09.28",
    location: "CARA · STORES",
    planetId: null,
    fragment: null,
    body:
      "Ration chalk. Recycled water tastes like old prayers. I am not hungry enough to steal from the sealed bay — yet.\n\nInteger euismod lacus luctus magna. Quisque cursus, metus vitae pharetra auctor, sem massa mattis sem, at interdum magna augue eget diam. Vestibulum ante ipsum primis in faucibus.",
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-10",
    title: "RELAY QUIET",
    date: "1541.10.16",
    location: "CARA · COMM",
    planetId: null,
    fragment: null,
    body:
      "Outer relays go mute for hours. Lattice keeps asking for a world I have never stood on. I do not answer.\n\nMorbi in dui quis est pulvinar ullamcorper. Nulla facilisi. Integer lacinia sollicitudin massa.",
  },

  /* ----- PLANET — HAIDER (fragment entry) ----- */
  {
    id: "flog-11",
    title: "SPIKE RESIDUAL",
    date: "1541.11.09",
    planetId: "haider",
    fragment: FRAG_BY_PLANET.haider,
    body: `Haider costs names. Letters home stop mid-sentence. What the line takes is [[${FRAG_BY_PLANET.haider}]].\n\nChart purge on Haider reads as a 3×5 bank of dark data blocks. Recovery is not random — press these once, row-major from the upper left: 01 · 04 · 05 · 09 · 10 · 12. Neighbors flip with the self. When every block burns, the dossier opens.\n\nJunk: grip · plate · 870 · gunsmith · all-on.`,
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-12",
    title: "UNRELATED DREAM",
    date: "1541.11.21",
    location: "CARA · BUNK",
    planetId: null,
    fragment: null,
    body:
      "Dreamt of a banquet under a triangle sun. Woke with phosphor burn behind the eyes. Not useful. Logging anyway.\n\nVestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
  },

  /* ----- PLANET — VOL (fragment entry) ----- */
  {
    id: "flog-13",
    title: "EDGE CARRIER",
    date: "1541.12.05",
    planetId: "vol",
    fragment: FRAG_BY_PLANET.vol,
    body: `Vol is the last well. Dead-line static answers only hunters. Last name in the noise: [[${FRAG_BY_PLANET.vol}]].\n\nChart Vol keeps a purge tray: the first three dossier purges you clear elsewhere appear there. Drag them onto the upper bar in true orbit — innermost left, outermost right — then commit.\n\nJunk: nonus · edge · carrier · 0979 · deadline · tray.`,
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-14",
    title: "MAINTENANCE BAY",
    date: "1542.01.12",
    location: "CARA · ENG",
    planetId: null,
    fragment: null,
    body:
      "Replaced a gasket with faith and tape. Engineering would court-martial me if Engineering still answered mail.\n\nProin eget tortor risus. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.",
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-15",
    title: "FALSE CONTACT",
    date: "1542.02.02",
    location: "CARA · TUNER",
    planetId: null,
    fragment: null,
    body:
      "Tuner ghosted a greeting on 097.9 then died. I did not chase it. Some doors open only once.\n\nVestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Nulla quis lorem ut libero malesuada feugiat. Nulla porttitor accumsan tincidunt.",
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-16",
    title: "CREW MANIFEST",
    date: "1542.02.19",
    location: "CARA · ARCHIVE",
    planetId: null,
    fragment: null,
    body:
      "Half the names are redacted. Half of those are probably me in different handwriting. Lattice keeps jokes like that.\n\nCurabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus suscipit tortor eget felis porttitor volutpat. Pellentesque in ipsum id orci porta dapibus.",
  },

  /* ----- SHIP — CARA (no planet) ----- */
  {
    id: "flog-17",
    title: "CALIBRATION",
    date: "1542.03.08",
    location: "CARA · OPTICS",
    planetId: null,
    fragment: null,
    body:
      "Recalibrated the eye. Outer still lies. Inner still hurts. Between them: work.\n\nDonec sollicitudin molestie malesuada. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Mauris blandit aliquet elit, eget tincidunt nibh pulvinar a.",
  },

  /* ----- PLANET — HEIXIN (fragment entry + audio) ----- */
  {
    id: "flog-heixin-partner",
    title: "EPITAPH",
    date: "1542.03.22",
    planetId: "heixin",
    fragment: FRAG_BY_PLANET.heixin,
    audio: "assets/audio/voice/flight-log/heixin-morse.mp3",
    body: `AUDIO TRANSMISSION // TRANSCRIBED
${PARTNER_MORSE.code}
[[${FRAG_BY_PLANET.heixin}]]`,
  },

];

export function buildFlatFlightLog() {
  const entries = FLIGHT_LOG_ENTRIES.map((e) => ({ ...e }));
  const fragEntries = entries.filter((e) => e.fragment);
  if (fragEntries.length !== EMPIRE_SEALS.length) {
    console.warn(
      `[flight-log] expected ${EMPIRE_SEALS.length} fragment entries, got ${fragEntries.length}`
    );
  }
  return {
    idle: FLIGHT_LOG_UI.idle,
    idleHint: FLIGHT_LOG_UI.idleHint,
    entries,
  };
}
