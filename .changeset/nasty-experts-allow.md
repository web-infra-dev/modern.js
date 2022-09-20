---
'@modern-js/server': patch
---

fix: invoke next() in dev-middleware directly if only api
fix: 在 api 服务的情况下，直接调用 next()，不执行 dev-middleware
