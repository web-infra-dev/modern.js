// Detection rules for the bundled docs gate, kept separate from the gate
// script so they can be unit-tested without triggering a docs build.
//
// The bundled pages must be readable on their own: the docs site renders
// components and inlines shared fragments at build time, so anything left
// pointing back at the site means an agent would hit content that never ships.

// Imports that would mean the page still depends on the docs site to render.
// Quote style varies across the docs, so accept either.
export const UNRESOLVED_IMPORT =
  /^import\s.*\sfrom\s+['"](@site-docs[^'"]*|@theme|@site\/[^'"]*)['"]/m;

// A component tag that survived the build renders as literal text for an
// agent, so its content never reaches the bundle. The build strips the
// imports, which is why checking those alone is not enough.
//
// Detected structurally rather than from a list of known names: a hardcoded
// list silently misses every component it does not enumerate. Only self-closing
// or attributed tags count — a bare `<Name>` also appears in type signatures
// such as `Promise<RsbuildConfig>`, which is prose.
export const UNRENDERED_COMPONENT = /<([A-Z][A-Za-z0-9]*)(\s[^>]*?)?\/>/;

/**
 * Strips fenced and inline code, where component usage is legitimate sample
 * markup. Fences may be indented — inside a list item, for example — so the
 * opening marker is matched with optional leading whitespace rather than at
 * the start of the line.
 */
export const stripCode = content =>
  content
    .replace(/^[ \t]*(`{3,4})[^\n]*\n[\s\S]*?^[ \t]*\1/gm, '')
    .replace(/`[^`\n]*`/g, '');
