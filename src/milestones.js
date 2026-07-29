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
  if (entryMeta.seedAfterPad) return true;
  if (hasImperialClearance()) return true;
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

  // Keyword entries never auto-grant Imperial — 9-slot assembler only
  return {
    newly: true,
    partnerReveal: Boolean(entryMeta.partnerReveal),
    grantedImperial: false,
    grantsFragment: Boolean(entryMeta.grantsFragment || entryMeta.imperialFragment),
    fragmentId: entryMeta.fragmentId || entryMeta.imperialFragment || null,
  };
}

/** Match Flight Log search query against unlock keywords (exact, case-insensitive). */
export function recoverByQuery(query, journals) {
  const q = String(query ?? "")
    .trim()
    .toLowerCase();
  if (!q) return [];

  const recovered = [];
  for (const journal of journals ?? []) {
    for (const entry of journal.entries ?? []) {
      const keys = entry.unlockKeywords ?? [];
      if (!keys.length) continue;
      const hit = keys.some((k) => String(k).toLowerCase() === q);
      if (!hit) continue;
      const result = recoverEntry(entry);
      if (result.newly) recovered.push({ entry, ...result });
    }
  }
  return recovered;
}

/* ==========================================================================
   JOURNAL ACCESS — three-digit volume keys (localStorage)
   ========================================================================== */

const JOURNAL_KEY = CLEARANCE?.journalKey ?? "lattice.journals";
let sessionJournals = null;

function readUnlockedJournals() {
  if (sessionJournals) return new Set(sessionJournals);
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    const list = raw ? JSON.parse(raw) : [];
    sessionJournals = Array.isArray(list) ? list : [];
  } catch {
    sessionJournals = [];
  }
  return new Set(sessionJournals);
}

function writeUnlockedJournals(set) {
  sessionJournals = [...set];
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(sessionJournals));
  } catch {
    /* session only */
  }
}

/** Volume browseable: startsOpen, already keyed, or Imperial Clearance. */
export function isJournalUnlocked(journal) {
  if (!journal) return false;
  if (hasImperialClearance()) return true;
  if (journal.startsOpen) return true;
  return readUnlockedJournals().has(journal.id);
}

/**
 * Attempt to unlock a journal with a 3-digit access code.
 * @returns {{ ok: boolean, newly?: boolean, reason?: string }}
 */
export function unlockJournalWithCode(journal, code) {
  if (!journal) return { ok: false, reason: "missing" };
  if (isJournalUnlocked(journal)) return { ok: true, newly: false };

  const expected = journal.accessCode != null ? String(journal.accessCode) : "";
  const attempt = String(code ?? "").replace(/\D/g, "");
  if (!expected) {
    return { ok: false, reason: "unknown" };
  }
  if (attempt !== expected) {
    return { ok: false, reason: "denied" };
  }

  const set = readUnlockedJournals();
  const newly = !set.has(journal.id);
  set.add(journal.id);
  writeUnlockedJournals(set);
  if (newly) audio.play("codeSuccess");
  return { ok: true, newly };
}
