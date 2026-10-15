---
'@modern-js/runtime-utils': patch
'@modern-js/server-core': patch
'@modern-js/server': patch
---

Share an isolated file reader across each server's HTML templates, static resources, development filesystem initialization and rebuild cache invalidation. This prevents stale HTML when custom adapters resolve separate runtime-utils copies and keeps different servers' caches independent.
