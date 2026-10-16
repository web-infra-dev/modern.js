---
'@modern-js/plugin-bff': patch
---

perf: skip body parsing for GET and HEAD BFF requests and reuse per-route param names

perf: BFF 的 GET 和 HEAD 请求跳过请求体解析，并复用每个路由的参数名
