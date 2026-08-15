# LATTICE.OS — Project Solus

Static ARG site. No build step, no backend. Progress is stored in the browser (`localStorage`).

## Pages

| File | Role |
|------|------|
| `intercept.html` | The dead drop. **This is the URL to share.** |
| `index.html` | Clearance pad and Cara terminal. Reached from the intercept gate. |

Serve the folder as static files (any host that can serve HTML / CSS / JS / MP3).

Wipe a playtest with `?cold=1` on either page.

## Layout

```
src/        runtime modules
content/    puzzles, copy, Archives catalog
assets/     images and audio
scripts/    optional local rebuild helpers (not part of play)
```

`lore/` is a private Obsidian vault and is **not** in git.

Operator notes live in `_internal/`. Keep this repository **private**. Those files are not linked from the UI, but they would still ship with a public clone.

## Local

Open `intercept.html` through a local static server (not `file://`) so ES modules and audio load correctly.
