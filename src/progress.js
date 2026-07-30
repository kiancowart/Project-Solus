/**
 * LATTICE.OS — ARG progress flags (STATUS puzzles, channel unlocks)
 */

import {
  ARG_PROGRESS_KEYS,
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
  return readJson(PLANETS_KEY, planetsRef, { cleared: {}, dossiers: {} });
}

export function markPlanetCleared(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  if (!id) return getPlanetClears();
  const data = getPlanetClears();
  const cleared = { ...(data.cleared ?? {}), [id]: true };
  writeJson(PLANETS_KEY, planetsRef, {
    cleared,
    dossiers: { ...(data.dossiers ?? {}) },
  });
  return getPlanetClears();
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
  writeJson(PLANETS_KEY, planetsRef, {
    cleared: { ...(data.cleared ?? {}) },
    dossiers,
  });
  return getPlanetClears();
}

export function isDossierUnlocked(planetId) {
  const id = String(planetId ?? "")
    .trim()
    .toLowerCase();
  if (!id) return false;
  return Boolean(getPlanetClears().dossiers?.[id]);
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
