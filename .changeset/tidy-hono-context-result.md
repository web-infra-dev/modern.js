---
'@modern-js/server-core': patch
---

fix(server-core): discard the AsyncLocalStorage callback result when registering request middleware so an unfinished Hono Context cannot escape as the response.

fix(server-core): 注册请求上下文中间件时，不再返回 AsyncLocalStorage 回调的结果，避免未完成的 Hono Context 被当作响应返回。
