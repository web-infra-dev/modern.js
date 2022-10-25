---
'@modern-js/runtime': patch
'@modern-js/plugin-koa': patch
'@modern-js/prod-server': patch
'@modern-js/server': patch
'@modern-js/types': patch
---

feat: remove node internal package like fs or path which import by ssr runtime
feat: 删除在 ssr runtime 中引用的 node 内部包
