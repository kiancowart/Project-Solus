/**
 * =============================================================================
 * build-lore-catalog.js — Regenerates content/lore-catalog.js
 * =============================================================================
 * Walks lore/Player Facing/Archives/{Recovered,Sealed}/ for .md digests.
 *   Recovered → full body; openable after Imperial Clearance
 *   Sealed    → title + keywords only; search can hit, body never opens
 *
 * Run from the project root:
 *   node scripts/build-lore-catalog.js
 * =============================================================================
 */

const fs = require("fs");
const path = require("path");

const archivesRoot = path.join(
  process.cwd(),
  "lore",
  "Player Facing",
  "Archives"
);

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
    else if (val.startsWith("[") && val.endsWith("]")) {
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body };
}

/** Strip author-only callouts / HTML comments so digests stay diegetic. */
function normalizeBody(md) {
  return String(md ?? "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^>\s*Player digest[^\n]*\n?/gim, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function walkTier() {
  const out = [];
  for (const tier of ["Recovered", "Sealed"]) {
    const dir = path.join(archivesRoot, tier);
    if (!fs.existsSync(dir)) continue;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith(".") || ent.name === "README.md") continue;
      if (!ent.isFile() || !ent.name.endsWith(".md")) continue;
      out.push({ full: path.join(dir, ent.name), tier });
    }
  }
  return out.sort((a, b) => a.full.localeCompare(b.full));
}

const files = walkTier();
const entries = files.map(({ full, tier }, i) => {
  const title = path
    .basename(full, ".md")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
  const { meta, body: rawBody } = parseFrontmatter(fs.readFileSync(full, "utf8"));
  const recovered =
    meta.recovered === true ||
    (meta.recovered !== false && tier === "Recovered");
  const body = recovered ? normalizeBody(rawBody) : "";
  const keywords = Array.isArray(meta.keywords)
    ? meta.keywords.join(" ")
    : String(meta.keywords || "");
  const locator = recovered
    ? `MEM/${title.toUpperCase()}`
    : `IDX/░/${title.toUpperCase()}`;

  return {
    id: `mem-${String(i + 1).padStart(3, "0")}`,
    title,
    path: locator,
    category: recovered ? "SHIP MEMORY" : "INDEX ONLY",
    trail: recovered ? ["SHIP MEMORY"] : ["INDEX", "SEALED"],
    search: `${title} ${locator} ${keywords} ${body}`
      .toLowerCase()
      .slice(0, 12000),
    recovered,
    body,
  };
});

const recoveredCount = entries.filter((e) => e.recovered).length;

const src = `/**
 * Auto-generated Archives catalog (Cara / Lattice ship memory).
 * Source: lore/Player Facing/Archives/{Recovered,Sealed}/
 * Regenerate: node scripts/build-lore-catalog.js
 *
 * recovered:true  → body opens after Imperial Clearance
 * recovered:false → search can hit; partition stays locked
 */
export const LORE_CATALOG = ${JSON.stringify(
  {
    generated: new Date().toISOString().slice(0, 10),
    count: entries.length,
    recoveredCount,
    entries,
  },
  null,
  2
)};
`;

fs.writeFileSync(path.join("content", "lore-catalog.js"), src);
console.log(
  `Wrote content/lore-catalog.js with ${entries.length} entries (${recoveredCount} recovered, ${entries.length - recoveredCount} sealed)`
);
