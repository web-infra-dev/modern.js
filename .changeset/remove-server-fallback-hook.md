---
'@modern-js/server-core': patch
---

Remove the server plugin `fallback` hook. SSR-to-CSR fallback events are now reported directly through request monitors as a warning and an `ssr-fallback` counter.
