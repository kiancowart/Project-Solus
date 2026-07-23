const fs = require('fs');
const path = require('path');

const root = path.join(process.cwd(), 'lore');
const PLAYER_PREFIX = 'Player Facing/';

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(full);
  }
  return out;
}

/** Strip YAML frontmatter; return markdown body. */
function extractBody(raw) {
  let text = String(raw ?? '').replace(/^\uFEFF/, '');
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end !== -1) {
      text = text.slice(end + 4);
    }
  }
  return text.trim();
}

/** Light cleanup for search / display (keep readable prose). */
function normalizeBody(md) {
  return extractBody(md)
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}

const files = walk(root).sort();
const entries = files.map((full, i) => {
  const rel = path.relative(root, full).split(path.sep).join('/');
  const parts = rel.replace(/\.md$/i, '').split('/');
  const title = parts[parts.length - 1]
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\(\)\s*$/, '')
    .trim();
  const category = parts.length > 1 ? parts[0] : 'Root';
  const trail = parts.slice(0, -1);
  const playerFacing = rel.startsWith(PLAYER_PREFIX);
  const entry = {
    id: `lore-${String(i + 1).padStart(3, '0')}`,
    title,
    path: rel,
    category,
    trail,
    search: `${title} ${rel}`.toLowerCase(),
    recovered: false,
  };

  if (playerFacing) {
    const body = normalizeBody(fs.readFileSync(full, 'utf8'));
    entry.body = body;
    entry.recovered = true;
    entry.search = `${title} ${rel} ${body}`.toLowerCase().slice(0, 12000);
  }

  return entry;
});

const recoveredCount = entries.filter((e) => e.recovered).length;

const src = `/**
 * Auto-generated lore catalog.
 * Source: lore/ → Obsidian vault.
 * Bodies ship ONLY for notes under Player Facing/; all other entries are metadata.
 * Archives shows Recovery pending for sealed hits.
 * Regenerate: node scripts/build-lore-catalog.js
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

fs.writeFileSync('lore-catalog.js', src);
console.log(
  'Wrote lore-catalog.js with',
  entries.length,
  'entries (',
  recoveredCount,
  'player-facing recovered)'
);
