---
'@modern-js/server-core': patch
---

Invalidate the resource plugin's own file cache after a development rebuild so custom server adapters do not serve stale HTML when dependencies resolve multiple runtime-utils instances.
