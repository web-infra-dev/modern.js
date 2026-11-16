---
'@modern-js/plugin-module-federation': patch
'@modern-js/server-core': patch
---

Wait for producer build readiness before admitting development SSR requests, including manifest fallback, so early browser reloads cannot render an outdated server generation. Allow the application admission hook to return a response directly when readiness fails.
