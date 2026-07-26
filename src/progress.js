/**
 * LATTICE.OS — ARG progress flags (STATUS puzzles, channel unlocks)
 */

import { ARG_PROGRESS_KEYS } from "../content/arg-path.js";

const HULL_KEY = ARG_PROGRESS_KEYS.hull;
const UNLOCK_KEY = ARG_PROGRESS_KEYS.unlock;
const DRAFT_KEY = ARG_PROGRESS_KEYS.clearanceDraft;
const FRAG_KEY = ARG_PROGRESS_KEYS.fragments;

let sessionHull = null;
let sessionUnlock = null;
let sessionDraft = null;
let sessionFrags = null;

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

export function getHullProgress() {
  return readJson(HULL_KEY, hullRef, {
    optics: false,
    inner: false,
    chartPuzzle: false,
    logPuzzle: false,
  });
}

export function setHullProgress(patch) {
  const next = { ...getHullProgress(), ...patch };
  writeJson(HULL_KEY, hullRef, next);
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
  return set;
}

/** Keys wiped by cold start / purge (in addition to legacy list). */
export const PROGRESS_STORAGE_KEYS = [
  HULL_KEY,
  UNLOCK_KEY,
  DRAFT_KEY,
  FRAG_KEY,
];

export function resetProgressSession() {
  hullRef.value = null;
  unlockRef.value = null;
  draftRef.value = null;
  fragRef.value = null;
  sessionHull = null;
  sessionUnlock = null;
  sessionDraft = null;
  sessionFrags = null;
}
