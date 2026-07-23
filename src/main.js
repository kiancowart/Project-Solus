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
import { initHullPlan, initFthConsole } from "./hull.js";
import { initFlightLog } from "./flight-log.js";
import { initArchives } from "./archives.js";
import { applyColdStartFromQuery } from "./cold-start.js";

applyColdStartFromQuery();

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initSystems();
  initImagoReturn();
  initWhisper();
  initCartography();
  initHullPlan();
  initFthConsole();
  initFlightLog();
  initArchives();
  applyClearanceUI();
  runBoot();
});
