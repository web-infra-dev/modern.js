---
'@modern-js/runtime': minor
'@modern-js/plugin-tanstack': minor
---

feat(runtime): move TanStack Router integration to `@modern-js/plugin-tanstack`

- add `@modern-js/plugin-tanstack` runtime/cli package surface
- add generic runtime router CLI and SSR hooks so router integrations can be implemented by plugins
- keep TanStack route generation/runtime ownership in the standalone plugin instead of `@modern-js/runtime`
