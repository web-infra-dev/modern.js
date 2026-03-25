---
'@modern-js/create': minor
'@modern-js/runtime': minor
'@modern-js/plugin-tanstack': minor
---

feat(create): support `--router tanstack` and `--tailwind` scaffolding

- add router selection for React Router / TanStack Router in `@modern-js/create`
- add Tailwind CSS v4 scaffold option (`--tailwind`) with `postcss.config.mjs` and `tailwind.config.ts`
- for TanStack scaffolds, register `tanstackRouterPlugin()` and use `src/views` as the convention directory

feat(runtime): move TanStack Router integration to `@modern-js/plugin-tanstack`

- add `@modern-js/plugin-tanstack` runtime/cli package surface
- remove `@modern-js/runtime/tanstack-router` export from `@modern-js/runtime`
- migrate TanStack route generation/runtime ownership from core runtime to the standalone plugin
