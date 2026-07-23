const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'lore');
function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(full);
  }
  return out;
}
const files = walk(root).sort();
const entries = files.map((full, i) => {
  const rel = path.relative(root, full).split(path.sep).join('/');
  const parts = rel.replace(/\.md$/i, '').split('/');
  const title = parts[parts.length - 1].replace(/\s*\([^)]*\)\s*$/, '').replace(/\(\)\s*$/, '').trim();
  const category = parts.length > 1 ? parts[0] : 'Root';
  const trail = parts.slice(0, -1);
  return {
    id: `lore-${String(i + 1).padStart(3, '0')}`,
    title,
    path: rel,
    category,
    trail,
    search: `${title} ${rel}`.toLowerCase(),
  };
});
const src = `/**
 * Auto-generated lore catalog (metadata only).
 * Source: lore/ → Obsidian vault. Bodies are not shipped; Archives shows Recovery pending.
 * Regenerate: node scripts/build-lore-catalog.js
 */
export const LORE_CATALOG = ${JSON.stringify({ generated: new Date().toISOString().slice(0, 10), count: entries.length, entries }, null, 2)};
`;
fs.writeFileSync('lore-catalog.js', src);
console.log('Wrote lore-catalog.js with', entries.length, 'entries');
