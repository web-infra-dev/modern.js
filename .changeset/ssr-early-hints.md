---
'@modern-js/server-core': patch
---

feat(server-core): add `server.ssr.earlyHints` to send `103 Early Hints` for the template assets and the matched route assets before data loaders run.

feat(server-core)：新增 `server.ssr.earlyHints`，在执行 data loader 之前发送 `103 Early Hints`，预加载模板资源和命中路由的资源。
