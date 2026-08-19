/**
 * planet-text.js — scramble uncleared planet names inside prose
 *
 * Any world whose Chart dossier is still locked has every mention of its name
 * (and listed aliases) replaced with corruption glyphs — same seed as map labels.
 */

import { SYSTEM_CHART, PLANET_NAME_ALIASES } from "../content/chart-content.js";
import { isDossierUnlocked } from "./progress.js";
import { scrambleText } from "./motion.js";

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Longest tokens first when multiple alias strings share a planet id. */
function buildNameTokens() {
  const bodies = SYSTEM_CHART.bodies ?? [];
  const tokens = [];
  for (const body of bodies) {
    const id = body.id;
    const names = new Set([
      body.name,
      body.name.toUpperCase(),
      id,
      id.toUpperCase(),
      ...(PLANET_NAME_ALIASES[id] ?? []),
    ]);
    for (const name of names) {
      const token = String(name ?? "").trim();
      if (!token) continue;
      tokens.push({ id, name: token, len: token.length });
    }
  }
  tokens.sort((a, b) => b.len - a.len);
  return tokens;
}

const nameByPlanetId = Object.fromEntries(
  (SYSTEM_CHART.bodies ?? []).map((b) => [b.id, b.name])
);

const nameTokens = buildNameTokens();

function planetScrambleSeed(planetId) {
  const clear = String(nameByPlanetId[planetId] ?? planetId).toUpperCase();
  return clear.length + 3;
}

/**
 * Replace every uncleared planet name (and alias) in `text` with glyph corruption.
 * Cleared worlds stay readable; each locked world uses the same seed as map labels.
 */
export function scrambleUnclearedPlanetNames(text) {
  let out = String(text ?? "");
  if (!out) return out;

  for (const { id, name } of nameTokens) {
    if (isDossierUnlocked(id)) continue;
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "gi");
    const seed = planetScrambleSeed(id);
    out = out.replace(re, (match) => scrambleText(match, seed));
  }
  return out;
}
