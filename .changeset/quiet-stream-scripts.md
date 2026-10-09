---
'@modern-js/app-tools': patch
---

Keep deferred entry scripts deferred during streaming SSR so hydration cannot
race an incomplete streamed `_ROUTER_DATA` script.
