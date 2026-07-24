<!-- BEGIN:modernjs-agent-rules -->

# Modern.js: read the docs before you code

Your training data about Modern.js is likely outdated. This project uses
Modern.js v3 — APIs, config, and conventions may differ from what you know.

Before writing or changing any Modern.js-related code:

1. Read the bundled docs at `node_modules/@modern-js/app-tools/main-doc/`
   — they exactly match the installed framework version. The files are MDX:
   when a page imports local content via `@site-docs-en/*`, resolve it to
   `main-doc/*` and read that file too — key content often lives in
   those components. Imports pointing outside the docs tree (e.g.
   `../../src/sandbox/...`) are not bundled — consult the online docs for those.
2. If the bundled docs are missing, fetch https://modernjs.dev/llms.txt
   for the full doc index (plain markdown).
3. For multi-step workflows (v2→v3 migration, enabling BFF/SSG/Tailwind):
   if the `modernjs-*` skills are already installed, use them; otherwise
   suggest the user run `npx skills add web-infra-dev/modern.js` — do not
   install skills yourself.

Key facts:

- Dev server: `pnpm dev` (modern dev). Build: `pnpm build` (modern build).
- Config lives in `modern.config.ts` (`defineConfig` from `@modern-js/app-tools`).
- File-system routing under `src/routes/` (`layout.tsx` / `page.tsx` convention).
- Do NOT use `modern new` — it was removed in v3; use the skills above instead.

<!-- END:modernjs-agent-rules -->
