/**
 * LATTICE.OS — ARG milestones + Imperial Clearance persistence
 */

import { CLEARANCE } from "../content/boot-content.js";
import { audio } from "./audio.js";

/* ==========================================================================
   MILESTONES — recovered Flight Log entry ids (localStorage)
   ========================================================================== */

const MILESTONE_KEY = CLEARANCE?.milestoneKey ?? "lattice.milestones";
const CLEARANCE_KEY = CLEARANCE?.storageKey ?? "lattice.clearance";
const CLEARANCE_IMPERIAL = CLEARANCE?.imperialValue ?? "imperial";
const CLEARANCE_LEGACY_DEEP = CLEARANCE?.deepValue ?? "deep";

let sessionImperial = false;
let sessionMilestones = null;

function readMilestones() {
  if (sessionMilestones) return new Set(sessionMilestones);
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    sessionMilestones = Array.isArray(list) ? list : [];
  } catch {
    sessionMilestones = [];
  }
  return new Set(sessionMilestones);
}

function writeMilestones(set) {
  sessionMilestones = [...set];
  try {
    localStorage.setItem(MILESTONE_KEY, JSON.stringify(sessionMilestones));
  } catch {
    /* private mode — session only */
  }
}

export function hasImperialClearance() {
  if (sessionImperial) return true;
  try {
    const v = localStorage.getItem(CLEARANCE_KEY);
    return v === CLEARANCE_IMPERIAL || v === CLEARANCE_LEGACY_DEEP;
  } catch {
    return false;
  }
}

/** @deprecated use hasImperialClearance */
export function hasDeepClearance() {
  return hasImperialClearance();
}

export function grantImperialClearance() {
  sessionImperial = true;
  try {
    localStorage.setItem(CLEARANCE_KEY, CLEARANCE_IMPERIAL);
  } catch {
    /* session flag still unlocks */
  }
}

/** @deprecated use grantImperialClearance */
export function grantDeepClearance() {
  grantImperialClearance();
}

export function isEntryRecovered(entryId, entryMeta = {}) {
  if (hasImperialClearance()) return true;
  if (entryMeta.seedAfterPad) return true;
  return readMilestones().has(entryId);
}

export function recoverEntry(entryMeta) {
  if (!entryMeta?.id) return { newly: false };
  const set = readMilestones();
  if (set.has(entryMeta.id) || entryMeta.seedAfterPad) {
    return { newly: false };
  }
  set.add(entryMeta.id);
  writeMilestones(set);

  const stinger = entryMeta.stinger || "milestone";
  if (stinger === "imperial") audio.play("imperial");
  else if (stinger === "reveal") audio.play("reveal");
  else audio.play("milestone");

  let grantedImperial = false;
  if (entryMeta.grantsImperial) {
    grantImperialClearance();
    grantedImperial = true;
    audio.play("imperial");
  }

  return {
    newly: true,
    partnerReveal: Boolean(entryMeta.partnerReveal),
    grantedImperial,
  };
}

/** Match Flight Log search query against unlock keywords. */
export function recoverByQuery(query, journals) {
  const q = String(query ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!q) return [];

  const recovered = [];
  for (const journal of journals ?? []) {
    for (const entry of journal.entries ?? []) {
      const keys = entry.unlockKeywords ?? [];
      if (!keys.length) continue;
      const hit = keys.some((k) => {
        const n = String(k).toLowerCase();
        return q === n || q.includes(n) || n.includes(q);
      });
      if (!hit) continue;
      const result = recoverEntry(entry);
      if (result.newly) recovered.push({ entry, ...result });
    }
  }
  return recovered;
}
