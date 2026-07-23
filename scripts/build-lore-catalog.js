/**
 * Build Archives catalog from Obsidian Player Facing digests only.
 * Flight Log drafts are excluded (they ship via build-flight-log.js).
 *
 * Author folder name "Player Facing/" never appears in catalog fields
 * shown to operators — use diegetic labels instead.
 *
 * Output: content/lore-catalog.js
 * Run: node scripts/build-lore-catalog.js
 */

const fs = require("fs");
const path = require("path");

const loreRoot = path.join(process.cwd(), "lore");
const digestRoot = path.join(loreRoot, "Player Facing");
const FLIGHT_LOG_DIR = "Flight Log";

function walkDigests(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    if (ent.name === "README.md") continue;
    if (ent.name === FLIGHT_LOG_DIR) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDigests(full, out);
    else if (ent.isFile() && ent.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function extractBody(raw) {
  let text = String(raw ?? "").replace(/^\uFEFF/, "");
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) text = text.slice(end + 4);
  }
  return text.trim();
}

/** Strip author-only callouts so digests stay diegetic in Archives. */
function normalizeBody(md) {
  return extractBody(md)
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/^>\s*Player digest[^\n]*\n?/gim, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

const files = walkDigests(digestRoot).sort();
const entries = files.map((full, i) => {
  const relFromDigest = path
    .relative(digestRoot, full)
    .split(path.sep)
    .join("/");
  const parts = relFromDigest.replace(/\.md$/i, "").split("/");
  const title = parts[parts.length - 1]
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\(\)\s*$/, "")
    .trim();
  const subtrail = parts.slice(0, -1);
  const body = normalizeBody(fs.readFileSync(full, "utf8"));
  /** Diegetic locator — never include the author folder name */
  const locator =
    subtrail.length > 0
      ? `MEM/${subtrail.join("/").toUpperCase()}/${title.toUpperCase()}`
      : `MEM/${title.toUpperCase()}`;

  return {
    id: `mem-${String(i + 1).padStart(3, "0")}`,
    title,
    /** Shown in Archives UI */
    path: locator,
    category: "SHIP MEMORY",
    trail: ["SHIP MEMORY", ...subtrail],
    search: `${title} ${locator} ${body}`.toLowerCase().slice(0, 12000),
    recovered: true,
    body,
  };
});

const src = `/**
 * Auto-generated Archives catalog (diegetic ship memory digests only).
 * Source: lore/Player Facing/ digests (excluding Flight Log/ and README).
 * Regenerate: node scripts/build-lore-catalog.js
 */
export const LORE_CATALOG = ${JSON.stringify(
  {
    generated: new Date().toISOString().slice(0, 10),
    count: entries.length,
    recoveredCount: entries.length,
    entries,
  },
  null,
  2
)};
`;

fs.writeFileSync(path.join("content", "lore-catalog.js"), src);
console.log(
  `Wrote content/lore-catalog.js with ${entries.length} ship-memory digest(s)`
);
