/**
 * LATTICE.OS — ARG progress flags (STATUS puzzles, channel unlocks)
 */

import {
  ARG_PROGRESS_KEYS,
  EMPIRE_SEALS,
  IMPERIAL_SLOTS,
  SEAL_BANDS,
  sealById,
} from "../content/arg-path.js";

const HULL_KEY = ARG_PROGRESS_KEYS.hull;
const UNLOCK_KEY = ARG_PROGRESS_KEYS.unlock;
const DRAFT_KEY = ARG_PROGRESS_KEYS.clearanceDraft;
const FRAG_KEY = ARG_PROGRESS_KEYS.fragments;
const PLANETS_KEY = ARG_PROGRESS_KEYS.planets;
const SEAL_ORDER_KEY = ARG_PROGRESS_KEYS.sealOrder;

let sessionHull = null;
let sessionUnlock = null;
let sessionDraft = null;
let sessionFrags = null;
let sessionPlanets = null;
let sessionSealOrder = null;

function readJson(key, sessionRef, fallback) {
  if (sessionRef.value) return sessionRef.value;
  try {
    const raw = localStorage.getItem(key);
    sessionRef.value = raw ? JSON.parse(raw) : fallback;
  } catch {
    sessionRef.value = fallback;
  }
  if (!sessionRef.value || typeof sessionRef.value !== "object") {
    sessionRef.value = fallback;
  }
  return sessionRef.value;
}

function writeJson(key, sessionRef, value) {
  sessionRef.value = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* session only */
  }
}

const hullRef = { value: null };
const unlockRef = { value: null };
const draftRef = { value: null };
const fragRef = { value: null };
const planetsRef = { value: null };
const sealOrderRef = { value: null };

export function getHullProgress() {
  return readJson(HULL_KEY, hullRef, {
    optics: false,
    inner: false,
    chartPuzzle: false,
    logPuzzle: false,
    teavictaProtocol: false,
    volEdge: false,
  });
}

export function setHullProgress(patch) {
  const next = { ...getHullProgress(), ...patch };
  writeJson(HULL_KEY, hullRef, next);
  try {
    window.dispatchEvent(new CustomEvent("lattice:hull"));
  } catch {
    /* non-browser */
  }
  return next;
}

export function getChannelUnlocks() {
  return readJson(UNLOCK_KEY, unlockRef, {
    cartography: false,
    flightlog: false,
  });
}

export function setChannelUnlock(panelId, value = true) {
  const next = { ...getChannelUnlocks(), [panelId]: Boolean(value) };
  writeJson(UNLOCK_KEY, unlockRef, next);
  return next;
}

export function isChannelUnlocked(panelId) {
  const u = getChannelUnlocks();
  if (panelId === "cartography") return Boolean(u.cartography);
  if (panelId === "flightlog") return Boolean(u.flightlog);
  return true;
}

/** Same STATUS / channel flags a successful Imperial 9-slot bind writes. */
export function unlockChannelsForImperialBind() {
  setChannelUnlock("cartography", true);
  setChannelUnlock("flightlog", true);
  setHullProgress({
    chartPuzzle: true,
    logPuzzle: true,
    optics: true,
    inner: true,
    teavictaProtocol: true,
    volEdge: true,
  });
  for (const slot of IMPERIAL_SLOTS) {
    markDossierUnlocked(slot.planetId);
  }
}

export function getClearanceDraft() {
  return readJson(DRAFT_KEY, draftRef, { slots: {} });
}

export function setClearanceDraft(draft) {
  writeJson(DRAFT_KEY, draftRef, draft);
  return draft;
}

function normalizeFragmentId(id) {
  return String(id ?? "")
    .trim()
    .toUpperCase()
    .replace(/[▽▼\s]+/g, "");
}

export function getRecoveredFragments() {
  const data = readJson(FRAG_KEY, fragRef, { ids: [] });
  const ids = Array.isArray(data.ids) ? data.ids : [];
  return new Set(ids.map(normalizeFragmentId).filter(Boolean));
}

export function markFragmentRecovered(fragmentId) {
  const id = normalizeFragmentId(fragmentId);
  if (!id) return getRecoveredFragments();
  const set = getRecoveredFragments();
  set.add(id);
  writeJson(FRAG_KEY, fragRef, { ids: [...set] });

  const slot = IMPERIAL_SLOTS.find(
    (s) => normalizeFragmentId(s.fragment) === id
  );
  if (slot?.planetId) markPlanetCleared(slot.planetId);

  return set;
}

export function getPlanetClears() {
  return readJson(PLANETS_KEY, planetsRef, {
    cleared: {},
    dossiers: {},
    dossierOrder: [],
  });
}

function writePlanetClears(next) {
  writeJson(PLANETS_KEY, planetsRef, {
    cleared: { ...(next.cleared ?? {}) },
    dossiers: { ...(next.dossiers ?? {}) },
    dossierOrder: Array.isArray(next.dossierOrder) ? [...next.dossierOrder] : [],
  });
  return getPlanetClears();
}

export function markPlanetCleared(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  if (!id) return getPlanetClears();
  const data = getPlanetClears();
  return writePlanetClears({
    ...data,
    cleared: { ...(data.cleared ?? {}), [id]: true },
  });
}

export function isPlanetCleared(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  if (!id) return false;
  return Boolean(getPlanetClears().cleared?.[id]);
}

export function markDossierUnlocked(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  if (!id) return getPlanetClears();
  const data = getPlanetClears();
  const dossiers = { ...(data.dossiers ?? {}), [id]: true };
  let dossierOrder = Array.isArray(data.dossierOrder) ? [...data.dossierOrder] : [];
  if (!dossierOrder.includes(id)) dossierOrder.push(id);
  return writePlanetClears({
    ...data,
    dossiers,
    dossierOrder,
  });
}

export function isDossierUnlocked(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  if (!id) return false;
  return Boolean(getPlanetClears().dossiers?.[id]);
}

/** Count Chart dossier unlocks; optionally exclude one world. */
export function countDossiersUnlocked({ exclude } = {}) {
  const skip = String(exclude ?? "")
    .trim()
    .toLowerCase();
  const dossiers = getPlanetClears().dossiers ?? {};
  return Object.keys(dossiers).filter((id) => dossiers[id] && id !== skip).length;
}

/** True when all nine Empire world Chart dossiers are unlocked. */
export function areAllPlanetDossiersUnlocked() {
  return EMPIRE_SEALS.every((s) => isDossierUnlocked(s.planetId));
}

/** True when every seal fragment has been recovered (clicked in Flight Log). */
export function areAllFragmentsRecovered() {
  const frags = getRecoveredFragments();
  return EMPIRE_SEALS.every((s) => frags.has(normalizeFragmentId(s.fragment)));
}

/**
 * First N dossier purges in unlock order (excludes Vol).
 * Used by the Vol orbit tray — capped at 3.
 */
export function getVolTrayPlanets({ limit = 3, exclude = "vol" } = {}) {
  const skip = String(exclude ?? "")
    .trim()
    .toLowerCase();
  const data = getPlanetClears();
  let order = Array.isArray(data.dossierOrder)
    ? data.dossierOrder.map((id) => String(id).toLowerCase()).filter(Boolean)
    : [];
  if (!order.length) {
    const dossiers = data.dossiers ?? {};
    order = Object.keys(dossiers).filter((id) => dossiers[id]);
  }
  const seen = new Set();
  const out = [];
  for (const id of order) {
    if (!id || id === skip || seen.has(id)) continue;
    if (data.dossiers && !data.dossiers[id]) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}

function shuffleIds(ids) {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function defaultSealOrder() {
  const out = {};
  for (const [band, spec] of Object.entries(SEAL_BANDS)) {
    out[band] = [...spec.sealIds];
  }
  return out;
}

function isValidSealOrder(order) {
  if (!order || typeof order !== "object") return false;
  for (const [band, spec] of Object.entries(SEAL_BANDS)) {
    const list = order[band];
    if (!Array.isArray(list) || list.length !== spec.sealIds.length) return false;
    const want = new Set(spec.sealIds);
    if (list.some((id) => !want.has(id))) return false;
    if (new Set(list).size !== list.length) return false;
  }
  return true;
}

/** Shuffled seal ids per band — created once per cold wipe. */
export function getSealOrder() {
  const data = readJson(SEAL_ORDER_KEY, sealOrderRef, null);
  if (isValidSealOrder(data)) return data;
  const next = {};
  for (const [band, spec] of Object.entries(SEAL_BANDS)) {
    next[band] = shuffleIds(spec.sealIds);
  }
  writeJson(SEAL_ORDER_KEY, sealOrderRef, next);
  return next;
}

/**
 * Map physical well slot (1–9) → seal record for this playthrough.
 * Left triangle = veil, mid = neutral, right = scourge.
 */
export function getSealWellAssignments() {
  const order = getSealOrder();
  /** @type {Record<number, ReturnType<typeof sealById>>} */
  const map = {};
  for (const [band, spec] of Object.entries(SEAL_BANDS)) {
    const ids = order[band] ?? spec.sealIds;
    spec.wellSlots.forEach((slotNum, i) => {
      map[slotNum] = sealById(ids[i]);
    });
  }
  return map;
}

export function getSealForWell(slotNum) {
  return getSealWellAssignments()[Number(slotNum)] ?? null;
}

/** Keys wiped by cold start / purge (in addition to legacy list). */
export const PROGRESS_STORAGE_KEYS = [
  HULL_KEY,
  UNLOCK_KEY,
  DRAFT_KEY,
  FRAG_KEY,
  PLANETS_KEY,
  SEAL_ORDER_KEY,
];

export function resetProgressSession() {
  hullRef.value = null;
  unlockRef.value = null;
  draftRef.value = null;
  fragRef.value = null;
  planetsRef.value = null;
  sealOrderRef.value = null;
  sessionHull = null;
  sessionUnlock = null;
  sessionDraft = null;
  sessionFrags = null;
  sessionPlanets = null;
  sessionSealOrder = null;
}

/* ==========================================================================
   COLD START — wipe ARG progress (?cold=1 / ?reset=1 / Imperial purge)
   ========================================================================== */

const COLD_KEYS = [
  "lattice.clearance",
  "lattice.milestones",
  "lattice.journals",
  "lattice.interceptTuned",
  "lattice.interceptEcho",
  "lattice.whisperStep",
  "lattice.whisperDone",
  "lattice.whisperSealed",
  "lattice.whisperSudokuSeen",
  "lattice.sealOrder",
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
