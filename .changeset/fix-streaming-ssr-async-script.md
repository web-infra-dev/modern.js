---
"@modern-js/app-tools": patch
---

fix: prevent async script loading in streaming SSR that causes _ROUTER_DATA race condition

HtmlAsyncChunkPlugin no longer rewrites defer scripts to async when streaming
SSR or RSC is enabled. Async scripts can execute before the _ROUTER_DATA inline
script is fully parsed under streaming (chunked) responses, causing hydration
races and double data fetching on cached visits.
