---
'@modern-js/server-core': patch
---

fix: use Hono's pathname normalization when matching render routes to handle encoded characters consistently

fix: 渲染路由匹配复用 Hono 的路径归一化，修复编码字符路径返回 404 的问题
