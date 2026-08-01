/**
 * LATTICE.OS — G512 Carapace (Cara), bonded: Solus
 * Boot playback, navigation, CRT fidelity, and interface audio.
 *
 * Intro splash COPY lives in: content/boot-content.js  ← edit text / logo there
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

try {
  applyColdStartFromQuery();
} catch (err) {
  console.error("[lattice] cold start threw", err);
}

document.addEventListener("DOMContentLoaded", () => {
  const safe = (label, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`[lattice] ${label} init failed`, err);
    }
  };

  // Shared CRT rails (terminal / chart / archives / …) — before channel inits
  safe("crt-rails", () => initCrtScrollRails());

  // Whisper before boot — clearance gate toggles the pad whisper chrome
  safe("whisper", initWhisper);

  // Pad first — never blocked behind channel inits
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
