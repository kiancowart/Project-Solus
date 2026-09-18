/**
 * =============================================================================
 * build-flight-log.js — STUB ONLY (does not build the site)
 * =============================================================================
 * LIVE Flight Log copy is content/flight-log-entries.js — edit that file.
 * Draft in Obsidian: lore/Player Facing/Flight Log/ (manual promote when ready).
 *
 * This script exits with an error on purpose. Do not run it as part of a
 * rebuild checklist. A future importer may emit flight-log-entries.js once
 * Obsidian entry frontmatter matches the live flat schema.
 *
 * Archives digests (not Flight Log) use: node scripts/build-lore-catalog.js
 * =============================================================================
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

function main() {
  const hint =
    "STUB: build-flight-log.js does not update the site.\n" +
    "Live copy: content/flight-log-entries.js\n" +
    "Draft desk: lore/Player Facing/Flight Log/ (promote manually).\n" +
    "For Archives Ship Memory: node scripts/build-lore-catalog.js";

  if (!fs.existsSync(journalsPath)) {
    console.error(hint);
    process.exit(1);
  }
  console.error(hint);
  process.exit(1);
}

main();
