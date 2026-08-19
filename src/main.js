/**
 * =============================================================================
 * main.js — Hub page entry point (index.html)
 * =============================================================================
 * WHAT THIS FILE DOES
 *   Wires every hub-side feature after the HTML loads. It does not contain
 *   puzzle answers, boot copy, or audio file paths — those live in content/.
 *
 * PAGE MAP
 *   index.html      → this file (src/main.js)
 *   intercept.html  → src/intercept.js  (radio tuner, separate page)
 *
 * STARTUP ORDER (do not shuffle without a reason)
 *   1. Cold-start wipe if the URL has ?cold=1 or ?reset=1
 *   2. CRT scroll rails (shared phosphor scrollbar look)
 *   3. Whisper pad ARG (must exist before boot toggles pad chrome)
 *   4. Boot / clearance keypad (never wait on other inits)
 *   5. Nav, diagnostics, Imago return, compass, chart, hull, flight log,
 *      archives, imperial assembler, then lock/unlock channel chrome
 *
 * WHERE TO EDIT INSTEAD OF HERE
 *   Boot log / pad code / music paths     → content/boot-content.js
 *   Puzzle answers / seals / dossiers     → content/arg-path.js
 *   Flight Log stories                    → content/flight-log-entries.js
 *   Archives lore text                    → lore/Player Facing/*.md then
 *                                           node scripts/build-lore-catalog.js
 *
 * SAFE TO CHANGE HERE
 *   Init order, or commenting-out a feature while testing (wrap in `safe()`).
 * =============================================================================
 */

import { applyClearanceUI } from "./clearance.js";
import { initNav, initSystems } from "./nav.js";
import { initImagoReturn, runBoot } from "./boot.js";
import { initWhisper } from "./whisper.js";
import { initCartography } from "./cartography.js";
import { initCompass } from "./compass.js";
import { initHullPlan, initFthConsole } from "./hull.js";
import { initFlightLog } from "./flight-log.js";
import { initArchives } from "./archives.js";
import { initImperialClearance } from "./imperial.js";
import { applyColdStartFromQuery } from "./progress.js";
import { initCrtScrollRails } from "./motion.js";

/* Wipe ARG progress if the operator opened with ?cold=1 or ?reset=1.
   Runs immediately (not waiting for DOM) so later inits see a clean slate. */
try {
  applyColdStartFromQuery();
} catch (err) {
  console.error("[lattice] cold start threw", err);
}

document.addEventListener("DOMContentLoaded", () => {
  /* One failed init must not kill the rest of the hub. */
  const safe = (label, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[lattice] ${label} init failed`, err);
    }
  };

  /* Shared CRT rails (terminal / chart / archives / …) — before channel inits */
  safe("crt-rails", () => initCrtScrollRails());

  /* Whisper before boot — clearance gate toggles the pad whisper chrome */
  safe("whisper", initWhisper);

  /* Pad first — never blocked behind channel inits */
  void runBoot().catch((err) => {
    console.error("[lattice] boot failed", err);
  });

  safe("nav", initNav);
  safe("systems", initSystems);
  safe("imago", initImagoReturn);
  safe("compass", initCompass);
  safe("cartography", initCartography);
  safe("hull", initHullPlan);
  safe("fth", initFthConsole);
  safe("flight-log", initFlightLog);
  safe("archives", initArchives);
  safe("imperial", initImperialClearance);
  safe("clearance-ui", applyClearanceUI);
});
