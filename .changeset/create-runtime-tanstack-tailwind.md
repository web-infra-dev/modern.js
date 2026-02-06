---
'@modern-js/create': minor
'@modern-js/runtime': minor
---

feat(create): support `--router tanstack` and `--tailwind` scaffolding

- add router selection for React Router / TanStack Router in `@modern-js/create`
- add Tailwind CSS v4 scaffold option (`--tailwind`) with `postcss.config.mjs` and `tailwind.config.ts`
- update create template output and docs for combined TanStack + Tailwind initialization

feat(runtime): expose TanStack Router runtime entrypoint

- add `@modern-js/runtime/tanstack-router` export for route component integration
- add TanStack route generation/runtime support and integration coverage
