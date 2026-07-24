<!-- BEGIN:modernjs-agent-rules -->

# Modern.js: read the docs before you code

This project uses Modern.js v3. Your training data is likely outdated — treat
the bundled docs as the source of truth. Before writing or changing any
Modern.js code, find and read the relevant page under
`node_modules/@modern-js/app-tools/docs/`. It exactly matches the installed
version. If a page is missing, use https://modernjs.dev/llms.txt as the online
index.

v3 essentials (don't rely on memory):

- File-system routing under `src/routes/` (`layout.tsx` / `page.tsx`).
- Config in `modern.config.ts` (`defineConfig` from `@modern-js/app-tools`).
- Scripts `dev` / `build` / `serve` map to `modern dev|build|serve`.
- There is no `modern new` command in v3.

<!-- END:modernjs-agent-rules -->
