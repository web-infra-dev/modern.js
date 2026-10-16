---
'@modern-js/plugin-data-loader': patch
'@modern-js/runtime-utils': patch
---

perf: reuse the static handler of data loader requests and match the entry without sorting the server routes on every request

perf: 数据加载请求复用 static handler，并且匹配入口时不再在每次请求时排序服务端路由
