/**
 * Build Flight Log source from Obsidian:
 *   lore/Player Facing/Flight Log/journals.json
 *   lore/Player Facing/Flight Log/entries/*.md
 *
 * Output: content/flight-log.generated.js
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
const outPath = path.join(process.cwd(), "content", "flight-log.generated.js");

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
    } else if (/^-?\d+$/.test(val)) {
      val = Number(val);
    }
    meta[key] = val;
  }
  return { meta, body };
}

function stripHtmlComments(md) {
  return md.replace(/<!--[\s\S]*?-->/g, "").trim();
}

const index = JSON.parse(fs.readFileSync(journalsPath, "utf8"));
const byJournal = new Map();
for (const j of index.journals) {
  byJournal.set(j.id, { ...j, entries: [] });
}

for (const stub of index.stubs ?? []) {
  const j = byJournal.get(stub.journal);
  if (!j) continue;
  j.entries.push({
    id: stub.id,
    title: stub.title ?? null,
    year: stub.year,
    cycle: stub.cycle,
    body: null,
    seedAfterPad: false,
    unlockKeywords: [],
    writeOrder: stub.writeOrder ?? 9999,
    tellOrder: stub.tellOrder ?? 9999,
  });
}

for (const name of fs.readdirSync(entriesDir).sort()) {
  if (!name.endsWith(".md")) continue;
  const raw = fs.readFileSync(path.join(entriesDir, name), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  if (!meta.id || !meta.journal) {
    console.warn(`Skip ${name}: need id + journal frontmatter`);
    continue;
  }
  const j = byJournal.get(meta.journal);
  if (!j) {
    console.warn(`Skip ${name}: unknown journal ${meta.journal}`);
    continue;
  }
  const entry = {
    id: meta.id,
    title: meta.title === undefined ? null : meta.title,
    year: meta.year,
    cycle: meta.cycle,
    body: stripHtmlComments(body) || null,
    seedAfterPad: Boolean(meta.seedAfterPad),
    unlockKeywords: Array.isArray(meta.unlockKeywords)
      ? meta.unlockKeywords
      : [],
    writeOrder: meta.writeOrder ?? 9999,
    tellOrder: meta.tellOrder ?? 9999,
    stinger: meta.stinger ?? null,
    partnerReveal: Boolean(meta.partnerReveal),
    grantsImperial: Boolean(meta.grantsImperial),
  };
  const idx = j.entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) j.entries[idx] = entry;
  else j.entries.push(entry);
}

for (const j of byJournal.values()) {
  j.entries.sort(
    (a, b) =>
      (a.tellOrder ?? 9999) - (b.tellOrder ?? 9999) ||
      (a.year ?? 0) - (b.year ?? 0) ||
      (a.cycle ?? 0) - (b.cycle ?? 0)
  );
}

const journals = index.journals.map((j) => byJournal.get(j.id));

const src = `/**
 * Auto-generated Flight Log source from Obsidian.
 * Edit: lore/Player Facing/Flight Log/
 * Regenerate: node scripts/build-flight-log.js
 */
export const FLIGHT_LOG_SOURCE = ${JSON.stringify(
  {
    generated: new Date().toISOString().slice(0, 10),
    journals,
  },
  null,
  2
)};
`;

fs.writeFileSync(outPath, src);
console.log(
  `Wrote ${outPath} (${journals.length} journals, ${journals.reduce(
    (n, j) => n + j.entries.length,
    0
  )} entries)`
);
