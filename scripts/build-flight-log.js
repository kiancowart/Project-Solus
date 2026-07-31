/**
 * Flight Log — Obsidian → site content (future / optional pipeline)
 *
 * LIVE source of truth for the site:
 *   content/flight-log-entries.js  (flat chronological entries)
 *
 * This script remains as a framework for regenerating from Obsidian:
 *   lore/Player Facing/Flight Log/journals.json
 *   lore/Player Facing/Flight Log/entries/*.md
 *
 * When the Obsidian corpus is ready for re-import, extend this script to
 * emit (or merge into) flight-log-entries.js rather than a parallel file.
 *
 * Run: node scripts/build-flight-log.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(
  process.cwd(),
  "lore",
  "Player Facing",
  "Flight Log"
);
const journalsPath = path.join(root, "journals.json");
const entriesDir = path.join(root, "entries");

function parseFrontmatter(raw) {
  let text = String(raw ?? "").replace(/^\uFEFF/, "");
  if (!text.startsWith("---")) {
    return { meta: {}, body: text.trim() };
  }
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: text.trim() };
  const yaml = text.slice(3, end).trim();
  const body = text.slice(end + 4).trim();
  const meta = {};
  for (const line of yaml.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (val === "null" || val === "~") val = null;
    else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    } else if (val.startsWith("[") && val.endsWith("]")) {
      try {
        val = JSON.parse(val.replace(/'/g, '"'));
      } catch {
        /* keep string */
      }
    } else if (/^-?\d+(\.\d+)?$/.test(val)) {
      val = Number(val);
    }
    meta[key] = val;
  }
  return { meta, body };
}

function main() {
  if (!fs.existsSync(journalsPath)) {
    console.error(
      "Obsidian Flight Log not found at lore/Player Facing/Flight Log/.\n" +
        "Live site content is content/flight-log-entries.js — edit that file for now.\n" +
        "This builder is reserved for a future Obsidian import pass."
    );
    process.exit(1);
  }
  console.error(
    "Obsidian corpus found, but the live site uses flat content/flight-log-entries.js.\n" +
      "Wire this script to emit that shape before relying on it in CI."
  );
  process.exit(2);
}

main();
