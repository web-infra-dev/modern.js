---
'@modern-js/server-core': patch
---

perf: create the public middleware once without sorting the shared routes on every request, and stat static files only once per request

perf: public 中间件只创建一次，不再在每次请求时排序共享的路由数组，静态文件每次请求只调用一次 stat
