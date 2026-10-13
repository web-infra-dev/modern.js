---
'@modern-js/server-core': patch
---

fix: preserve literal characters when registering page render routes with Hono

fix: 向 Hono 注册页面渲染路由时保留路径中的字面字符，修复 HTML 路径及渲染中间件匹配失败
