<!-- BEGIN:modernjs-agent-rules -->

# Modern.js: read the docs before you code

Your training data about Modern.js is likely outdated. This project uses
Modern.js v3 — APIs, config, and conventions may differ from what you know.

Before writing or changing any Modern.js-related code:

1. Fetch and read https://modernjs.dev/llms-full.txt — the full Modern.js
   documentation as a single plain-markdown file.
2. If that file is unreachable or too large to read at once, fetch
   https://modernjs.dev/llms.txt for the doc index and then fetch the
   specific pages you need.
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
