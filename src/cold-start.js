/**
 * ARG cold start — wipe Lattice progress keys when ?cold=1 (or ?reset=1)
 */

const COLD_KEYS = [
  "lattice.clearance",
  "lattice.milestones",
  "lattice.interceptTuned",
  "lattice.interceptEcho",
  "lattice.whisperStep",
  "lattice.whisperDone",
];

export function applyColdStartFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("cold") && !params.has("reset")) return false;

  try {
    for (const key of COLD_KEYS) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }

  // Strip the flag so a refresh doesn't keep wiping mid-playtest
  params.delete("cold");
  params.delete("reset");
  const q = params.toString();
  const next = `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
  return true;
}
