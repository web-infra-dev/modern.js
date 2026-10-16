---
'@modern-js/server-core': patch
---

fix: settle connect middleware that responds without calling next

fix: 在 connect 中间件未调用 next 而直接响应时结束 Hono 中间件链
