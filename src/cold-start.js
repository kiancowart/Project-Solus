/**
 * ARG cold start — wipe Lattice progress keys when ?cold=1 (or ?reset=1)
 */

import { PROGRESS_STORAGE_KEYS, resetProgressSession } from "./progress.js";

const COLD_KEYS = [
  "lattice.clearance",
  "lattice.milestones",
  "lattice.journals",
  "lattice.interceptTuned",
  "lattice.interceptEcho",
  "lattice.whisperStep",
  "lattice.whisperDone",
  ...PROGRESS_STORAGE_KEYS,
];

/** Wipe all ARG progress keys (pad, journals, intercept, whisper, STATUS). */
export function wipeLatticeProgress() {
  try {
    for (const key of COLD_KEYS) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
  resetProgressSession();
}

export function applyColdStartFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("cold") && !params.has("reset")) return false;

  wipeLatticeProgress();

  // Strip the flag so a refresh doesn't keep wiping mid-playtest
  params.delete("cold");
  params.delete("reset");
  const q = params.toString();
  const next = `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
  return true;
}
