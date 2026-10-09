---
'@modern-js/runtime': minor
'@modern-js/plugin': minor
---

Add independent application SSR and hydration APIs using generated Modern routes, request-scoped loaders, explicit hydration snapshots, and isolated memory routers. Pass the current request, runtime context, existing shell boundary, and React identifier prefix to streaming SSR extenders. Wait for the Host shell hydration data before running browser hooks, preserving SSR hydration when async entry scripts arrive before the data scripts.

Preserve the streaming shell marker sibling slot during client hydration so React useId values match the server-rendered tree.

Give each generated route entry its own route module registry, preventing applications with the same route IDs from overwriting each other's shouldRevalidate exports. Keep the legacy helpers available for existing generated bundles.
