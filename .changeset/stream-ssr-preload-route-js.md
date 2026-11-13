---
'@modern-js/runtime': patch
'@modern-js/server-core': patch
'@modern-js/app-tools': patch
---

fix(runtime): preload the JS of matched routes in streaming SSR, with chunks split from route dependencies at low priority; configurable by `server.ssr.preloadRouteScripts`.

fix(runtime)：流式 SSR 为命中路由的 JS 输出 preload，路由依赖拆出的 chunk 用低优先级，可通过 `server.ssr.preloadRouteScripts` 关闭。
