---
'@modern-js/runtime': patch
'@modern-js/server-core': patch
---

fix(runtime): preload the JS of matched routes in streaming SSR, at low priority; configurable by `server.ssr.preloadRouteScripts`.

fix(runtime)：流式 SSR 为命中路由的 JS 输出低优先级的 preload，可通过 `server.ssr.preloadRouteScripts` 关闭。
